import { describe, expect, it, vi } from "vitest";

import {
  createWebMcpJsonSnapshot,
  observeWebMcpTool,
  type WebMcpExecutionEvent,
} from "./execution-activity";
import type { WebMcpTool } from "./types";

function createTool(execute: WebMcpTool["execute"]): WebMcpTool {
  return {
    name: "place_product",
    title: "Place product",
    description: "Places a product in the room.",
    inputSchema: {
      type: "object",
      properties: { productId: { type: "string" } },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false },
    execute,
  };
}

describe("observeWebMcpTool", () => {
  it("records a correlated synchronous success without changing the result", () => {
    const result = { ok: true, placementId: "placement-1" };
    const execute = vi.fn(() => result);
    const events: WebMcpExecutionEvent[] = [];
    const observed = observeWebMcpTool(createTool(execute), (event) => events.push(event));
    const input = { productId: "rack" };
    const options = { signal: new AbortController().signal };

    expect(observed.execute(input, options)).toBe(result);
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(input, options);
    expect(events.map((event) => event.phase)).toEqual(["started", "returned"]);
    expect(events[0]).toMatchObject({
      toolName: "place_product",
      toolTitle: "Place product",
      readOnly: false,
      input: { json: JSON.stringify(input), truncated: false },
    });
    expect(events[1]).toMatchObject({
      applicationOutcome: "success",
      result: { json: JSON.stringify(result), truncated: false },
    });
    expect(events[1]?.executionId).toBe(events[0]?.executionId);
  });

  it("preserves asynchronous success", async () => {
    const result = { ok: true, placementId: "placement-2" };
    const events: WebMcpExecutionEvent[] = [];
    const promise = observeWebMcpTool(createTool(async () => result), (event) => {
      events.push(event);
    }).execute({}, undefined);

    await expect(promise).resolves.toBe(result);
    expect(events.map((event) => event.phase)).toEqual(["started", "returned"]);
    expect(events[1]).toMatchObject({ applicationOutcome: "success" });
  });

  it("distinguishes a fulfilled ok:false application result", async () => {
    const result = { ok: false, reason: "collision" };
    const execute = vi.fn(async () => result);
    const events: WebMcpExecutionEvent[] = [];
    const promise = observeWebMcpTool(createTool(execute), (event) => events.push(event))
      .execute({}, undefined);

    await expect(promise).resolves.toBe(result);
    expect(events.map((event) => event.phase)).toEqual(["started", "returned"]);
    expect(events[1]).toMatchObject({ applicationOutcome: "error" });
  });

  it("reports unknown unless ok is explicitly boolean", () => {
    const events: WebMcpExecutionEvent[] = [];
    observeWebMcpTool(createTool(() => ({ ok: "true" })), (event) => events.push(event))
      .execute({});
    expect(events[1]).toMatchObject({ applicationOutcome: "unknown" });
  });

  it("records and propagates the same synchronous error", () => {
    const error = new Error("cannot place");
    const events: WebMcpExecutionEvent[] = [];
    const observed = observeWebMcpTool(createTool(() => { throw error; }), (event) => {
      events.push(event);
    });

    expect(() => observed.execute({})).toThrow(error);
    expect(events.map((event) => event.phase)).toEqual(["started", "threw"]);
    expect(events[1]).toMatchObject({
      error: {
        json: JSON.stringify({ name: "Error", message: "cannot place" }),
        truncated: false,
      },
    });
  });

  it("records and propagates the same rejected error", async () => {
    const error = new TypeError("invalid input");
    const events: WebMcpExecutionEvent[] = [];
    const observed = observeWebMcpTool(
      createTool(() => Promise.reject(error)),
      (event) => events.push(event),
    );

    await expect(observed.execute({})).rejects.toBe(error);
    expect(events.map((event) => event.phase)).toEqual(["started", "threw"]);
  });

  it("isolates observer failures from sync and async execution", async () => {
    const syncResult = { ok: true };
    const asyncResult = { ok: true, async: true };
    const observer = vi.fn(() => { throw new Error("observer failed"); });

    expect(observeWebMcpTool(createTool(() => syncResult), observer).execute({}))
      .toBe(syncResult);
    await expect(
      observeWebMcpTool(createTool(async () => asyncResult), observer).execute({}),
    ).resolves.toBe(asyncResult);
    expect(observer).toHaveBeenCalledTimes(4);
  });

  it("does not replace a tool error when the observer also throws", () => {
    const toolError = new Error("tool failed");
    const observed = observeWebMcpTool(
      createTool(() => { throw toolError; }),
      () => { throw new Error("observer failed"); },
    );

    expect(() => observed.execute({})).toThrow(toolError);
  });

  it("preserves descriptor fields, annotation identity, and execute options", () => {
    const execute = vi.fn<WebMcpTool["execute"]>(() => ({ ok: true }));
    const original = createTool(execute);
    const observed = observeWebMcpTool(original, () => undefined);
    const options = { signal: new AbortController().signal };

    observed.execute({}, options);
    expect(observed).toMatchObject({
      name: original.name,
      title: original.title,
      description: original.description,
      inputSchema: original.inputSchema,
      annotations: original.annotations,
    });
    expect(observed.inputSchema).toBe(original.inputSchema);
    expect(observed.annotations).toBe(original.annotations);
    expect(execute.mock.calls[0]?.[1]).toBe(options);
  });

  it("keeps concurrent completions correlated with their starts", async () => {
    let resolveFirst: ((value: { ok: true; id: string }) => void) | undefined;
    let resolveSecond: ((value: { ok: true; id: string }) => void) | undefined;
    const pending = [
      new Promise<{ ok: true; id: string }>((resolve) => { resolveFirst = resolve; }),
      new Promise<{ ok: true; id: string }>((resolve) => { resolveSecond = resolve; }),
    ];
    const events: WebMcpExecutionEvent[] = [];
    const observed = observeWebMcpTool(
      createTool(() => pending.shift() as Promise<unknown>),
      (event) => events.push(event),
    );

    const first = observed.execute({ id: "first" });
    const second = observed.execute({ id: "second" });
    resolveSecond?.({ ok: true, id: "second" });
    await second;
    resolveFirst?.({ ok: true, id: "first" });
    await first;

    const starts = events.filter((event) => event.phase === "started");
    const returns = events.filter((event) => event.phase === "returned");
    expect(returns.map((event) => event.executionId)).toEqual([
      starts[1]?.executionId,
      starts[0]?.executionId,
    ]);
    expect(new Set(starts.map((event) => event.executionId))).toHaveLength(2);
  });
});

describe("createWebMcpJsonSnapshot", () => {
  it("redacts sensitive key variants without mutating the source", () => {
    const source = {
      password: "one",
      api_key: "two",
      accessToken: "three",
      nested: { refresh_token: "four", safe: "visible" },
    };

    const snapshot = createWebMcpJsonSnapshot(source);

    expect(JSON.parse(snapshot.json)).toEqual({
      password: "[REDACTED]",
      api_key: "[REDACTED]",
      accessToken: "[REDACTED]",
      nested: { refresh_token: "[REDACTED]", safe: "visible" },
    });
    expect(source.accessToken).toBe("three");
    expect(source.nested.refresh_token).toBe("four");
  });

  it("handles circular and non-serializable values safely", () => {
    const source: Record<string, unknown> = {
      callback: () => undefined,
      missing: undefined,
    };
    source.self = source;

    const parsed = JSON.parse(createWebMcpJsonSnapshot(source).json);

    expect(parsed).toMatchObject({
      callback: { $type: "function" },
      missing: { $type: "undefined" },
      self: { $type: "circular" },
    });
  });

  it("bounds oversized snapshots and marks truncation", () => {
    const snapshot = createWebMcpJsonSnapshot({ content: "🙂".repeat(100_000) });
    const parsed = JSON.parse(snapshot.json);

    expect(snapshot.truncated).toBe(true);
    expect(parsed.content).toMatchObject({
      $type: "truncated-string",
      originalLength: 200_000,
    });
    expect(new TextEncoder().encode(snapshot.json).byteLength).toBeLessThanOrEqual(
      128 * 1024,
    );
    expect(() => JSON.parse(snapshot.json)).not.toThrow();
  });

  it("limits traversal depth and collection size before serialization", () => {
    let nested: Record<string, unknown> = { final: true };
    for (let index = 0; index < 40; index += 1) nested = { nested };
    const snapshot = createWebMcpJsonSnapshot({
      nested,
      values: Array.from({ length: 10_000 }, (_, index) => index),
    });

    expect(snapshot.truncated).toBe(true);
    expect(snapshot.json).toContain('"$type":"truncated"');
    expect(new TextEncoder().encode(snapshot.json).byteLength).toBeLessThanOrEqual(
      128 * 1024,
    );
  });

  it("stops object enumeration after the collection limit", () => {
    const source = Object.fromEntries(
      Array.from({ length: 250 }, (_, index) => [`property-${index}`, index]),
    );
    const parsed = JSON.parse(createWebMcpJsonSnapshot(source).json);

    expect(parsed.$truncated).toBe("more properties");
    expect(parsed["property-199"]).toBe(199);
    expect(parsed["property-200"]).toBeUndefined();
  });

  it("applies the text budget to Error fields", () => {
    const snapshot = createWebMcpJsonSnapshot(new Error("x".repeat(100_000)));
    const parsed = JSON.parse(snapshot.json);

    expect(snapshot.truncated).toBe(true);
    expect(parsed.message).toMatchObject({
      $type: "truncated-string",
      originalLength: 100_000,
    });
  });

  it("survives unreadable properties", () => {
    const source = {} as Record<string, unknown>;
    Object.defineProperty(source, "broken", {
      enumerable: true,
      get: () => { throw new Error("no access"); },
    });

    expect(JSON.parse(createWebMcpJsonSnapshot(source).json)).toEqual({
      broken: { $type: "unreadable" },
    });
  });
});
