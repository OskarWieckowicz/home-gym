import type { WebMcpTool } from "./types";

const MAX_SNAPSHOT_BYTES = 128 * 1024;
const MAX_SNAPSHOT_DEPTH = 24;
const MAX_SNAPSHOT_NODES = 1_000;
const MAX_COLLECTION_ENTRIES = 200;
const MAX_STRING_BYTES = 32 * 1024;
const MAX_TOTAL_TEXT_BYTES = 64 * 1024;
const MAX_KEY_BYTES = 512;
const REDACTED_VALUE = "[REDACTED]";

export type WebMcpJsonSnapshot = {
  readonly json: string;
  readonly truncated: boolean;
};

type WebMcpExecutionDetails = {
  readonly executionId: string;
  readonly toolName: string;
  readonly toolTitle?: string;
  readonly readOnly: boolean;
  readonly startedAt: string;
  readonly input: WebMcpJsonSnapshot;
};

export type WebMcpExecutionEvent =
  | (WebMcpExecutionDetails & {
      readonly phase: "started";
    })
  | (WebMcpExecutionDetails & {
      readonly phase: "returned";
      readonly finishedAt: string;
      readonly durationMs: number;
      readonly result: WebMcpJsonSnapshot;
      readonly applicationOutcome: "success" | "error" | "unknown";
    })
  | (WebMcpExecutionDetails & {
      readonly phase: "threw";
      readonly finishedAt: string;
      readonly durationMs: number;
      readonly error: WebMcpJsonSnapshot;
    });

export type WebMcpExecutionObserver = (event: WebMcpExecutionEvent) => void;

type JsonCompatible =
  | null
  | boolean
  | number
  | string
  | JsonCompatible[]
  | { [key: string]: JsonCompatible };

type SnapshotBudget = {
  nodesRemaining: number;
  textBytesRemaining: number;
  truncated: boolean;
};

const TRUNCATED_VALUE: JsonCompatible = { $type: "truncated" };

function isSensitiveKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[^a-z0-9]/g, "");
  return /(password|secret|token|authorization|cookie|apikey)/.test(normalized);
}

function describeUnsupported(value: unknown, budget: SnapshotBudget): JsonCompatible {
  if (typeof value === "bigint") {
    return { $type: "bigint", value: snapshotString(String(value), budget) };
  }
  return { $type: typeof value };
}

function prefixWithinBytes(value: string, byteLimit: number): string {
  if (byteLimit <= 0) return "";
  let low = 0;
  let high = Math.min(value.length, byteLimit);
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (byteLength(value.slice(0, middle)) <= byteLimit) low = middle;
    else high = middle - 1;
  }
  return value.slice(0, low);
}

function snapshotString(value: string, budget: SnapshotBudget): JsonCompatible {
  const byteLimit = Math.min(MAX_STRING_BYTES, budget.textBytesRemaining);
  const candidate = value.slice(0, byteLimit);
  const candidateBytes = byteLength(candidate);
  if (value.length <= byteLimit && candidateBytes <= byteLimit) {
    budget.textBytesRemaining -= candidateBytes;
    return value;
  }

  const preview = prefixWithinBytes(value, byteLimit);
  budget.textBytesRemaining -= byteLength(preview);
  budget.truncated = true;
  return { $type: "truncated-string", preview, originalLength: value.length };
}

function snapshotKey(
  key: string,
  entryIndex: number,
  budget: SnapshotBudget,
): string {
  const byteLimit = Math.min(MAX_KEY_BYTES, budget.textBytesRemaining);
  const candidate = prefixWithinBytes(key, byteLimit);
  const candidateBytes = byteLength(candidate);
  budget.textBytesRemaining -= candidateBytes;
  if (candidate.length === key.length) return key;
  budget.truncated = true;
  return `${candidate}…#${entryIndex}`;
}

function snapshotArray(
  value: unknown[],
  ancestors: ReadonlySet<object>,
  budget: SnapshotBudget,
  depth: number,
): JsonCompatible {
  const entryCount = Math.min(value.length, MAX_COLLECTION_ENTRIES);
  const result = Array.from({ length: entryCount }, (_, index) => {
    try {
      return snapshotValue(value[index], ancestors, budget, depth);
    } catch {
      return { $type: "unreadable" };
    }
  });
  if (value.length > entryCount) {
    budget.truncated = true;
    result.push(TRUNCATED_VALUE);
  }
  return result;
}

function snapshotObject(
  value: object,
  ancestors: ReadonlySet<object>,
  budget: SnapshotBudget,
  depth: number,
): JsonCompatible {
  const result: Record<string, JsonCompatible> = {};
  let entryIndex = 0;
  try {
    for (const key in value) {
      if (!Object.hasOwn(value, key)) continue;
      if (entryIndex >= MAX_COLLECTION_ENTRIES) {
        budget.truncated = true;
        result.$truncated = "more properties";
        break;
      }
      const snapshotProperty = snapshotKey(key, entryIndex, budget);
      entryIndex += 1;
      if (isSensitiveKey(key)) {
        result[snapshotProperty] = REDACTED_VALUE;
        continue;
      }
      try {
        result[snapshotProperty] = snapshotValue(
          (value as Record<string, unknown>)[key],
          ancestors,
          budget,
          depth,
        );
      } catch {
        result[snapshotProperty] = { $type: "unreadable" };
      }
    }
  } catch {
    return { $type: "unreadable" };
  }
  return result;
}

function snapshotError(value: Error, budget: SnapshotBudget): JsonCompatible {
  try {
    return {
      name: snapshotString(value.name, budget),
      message: snapshotString(value.message, budget),
    };
  } catch {
    return { $type: "unreadable-error" };
  }
}

function snapshotValue(
  value: unknown,
  ancestors: ReadonlySet<object>,
  budget: SnapshotBudget,
  depth: number,
): JsonCompatible {
  if (budget.nodesRemaining <= 0 || depth > MAX_SNAPSHOT_DEPTH) {
    budget.truncated = true;
    return TRUNCATED_VALUE;
  }
  budget.nodesRemaining -= 1;

  if (typeof value === "string") return snapshotString(value, budget);
  if (value === null || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") return Number.isFinite(value) ? value : String(value);
  if (typeof value !== "object") return describeUnsupported(value, budget);
  if (ancestors.has(value)) return { $type: "circular" };

  const nextAncestors = new Set(ancestors).add(value);
  if (value instanceof Date) {
    try {
      return value.toISOString();
    } catch {
      return { $type: "invalid-date" };
    }
  }
  if (value instanceof Error) {
    return snapshotError(value, budget);
  }
  if (Array.isArray(value)) {
    return snapshotArray(value, nextAncestors, budget, depth + 1);
  }
  return snapshotObject(value, nextAncestors, budget, depth + 1);
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function truncateJson(json: string): string {
  let low = 0;
  let high = json.length;
  let best = JSON.stringify({ $truncated: "" });
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = JSON.stringify({ $truncated: json.slice(0, middle) });
    if (byteLength(candidate) <= MAX_SNAPSHOT_BYTES) {
      best = candidate;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return best;
}

export function createWebMcpJsonSnapshot(value: unknown): WebMcpJsonSnapshot {
  try {
    const budget: SnapshotBudget = {
      nodesRemaining: MAX_SNAPSHOT_NODES,
      textBytesRemaining: MAX_TOTAL_TEXT_BYTES,
      truncated: false,
    };
    const json = JSON.stringify(snapshotValue(value, new Set(), budget, 0));
    if (byteLength(json) <= MAX_SNAPSHOT_BYTES) {
      return { json, truncated: budget.truncated };
    }
    return { json: truncateJson(json), truncated: true };
  } catch {
    return {
      json: JSON.stringify({ $type: "snapshot-error" }),
      truncated: false,
    };
  }
}

let nextExecutionNumber = 0;

function executionId(): string {
  nextExecutionNumber += 1;
  return `webmcp-${Date.now()}-${nextExecutionNumber}`;
}

function notify(observer: WebMcpExecutionObserver, event: WebMcpExecutionEvent): void {
  try {
    observer(event);
  } catch {
    // Observability is best-effort and must never affect tool execution.
  }
}

function outcomeOf(result: unknown): "success" | "error" | "unknown" {
  try {
    if (typeof result !== "object" || result === null) return "unknown";
    const ok = (result as { readonly ok?: unknown }).ok;
    if (ok === true) return "success";
    if (ok === false) return "error";
  } catch {
    // A throwing `ok` accessor is not an explicit boolean outcome.
  }
  return "unknown";
}

function errorSnapshot(error: unknown): WebMcpJsonSnapshot {
  try {
    if (error instanceof Error) {
      return createWebMcpJsonSnapshot({ name: error.name, message: error.message });
    }
  } catch {
    return createWebMcpJsonSnapshot({ $type: "unreadable-error" });
  }
  return createWebMcpJsonSnapshot(error);
}

export function observeWebMcpTool(
  tool: WebMcpTool,
  observer: WebMcpExecutionObserver,
): WebMcpTool {
  return {
    ...tool,
    execute(input, options) {
      const startedTime = Date.now();
      const details: WebMcpExecutionDetails = {
        executionId: executionId(),
        toolName: tool.name,
        ...(tool.title === undefined ? {} : { toolTitle: tool.title }),
        readOnly: tool.annotations?.readOnlyHint === true,
        startedAt: new Date(startedTime).toISOString(),
        input: createWebMcpJsonSnapshot(input),
      };
      notify(observer, { ...details, phase: "started" });

      const recordReturned = (result: unknown): unknown => {
        const finishedTime = Date.now();
        notify(observer, {
          ...details,
          phase: "returned",
          finishedAt: new Date(finishedTime).toISOString(),
          durationMs: Math.max(0, finishedTime - startedTime),
          result: createWebMcpJsonSnapshot(result),
          applicationOutcome: outcomeOf(result),
        });
        return result;
      };
      const recordThrown = (error: unknown): never => {
        const finishedTime = Date.now();
        notify(observer, {
          ...details,
          phase: "threw",
          finishedAt: new Date(finishedTime).toISOString(),
          durationMs: Math.max(0, finishedTime - startedTime),
          error: errorSnapshot(error),
        });
        throw error;
      };

      let result: unknown;
      try {
        result = tool.execute(input, options);
      } catch (error) {
        return recordThrown(error);
      }
      if (result instanceof Promise) return result.then(recordReturned, recordThrown);
      return recordReturned(result);
    },
  };
}
