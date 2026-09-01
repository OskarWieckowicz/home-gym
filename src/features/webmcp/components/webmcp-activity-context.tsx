"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";

import type {
  WebMcpExecutionEvent,
  WebMcpExecutionObserver,
  WebMcpJsonSnapshot,
} from "../execution-activity";
import type { WebMcpBridgeState } from "./use-webmcp-bridge-state";

const MAX_ACTIVITY_ENTRIES = 50;

export type WebMcpActivityEntry = {
  readonly executionId: string;
  readonly toolName: string;
  readonly toolTitle?: string;
  readonly readOnly: boolean;
  readonly startedAt: string;
  readonly input: WebMcpJsonSnapshot;
  readonly phase: "started" | "returned" | "threw";
  readonly finishedAt?: string;
  readonly durationMs?: number;
  readonly result?: WebMcpJsonSnapshot;
  readonly applicationOutcome?: "success" | "error" | "unknown";
  readonly error?: WebMcpJsonSnapshot;
};

type ActivityState = {
  readonly entries: readonly WebMcpActivityEntry[];
  readonly open: boolean;
  readonly selectedId: string | null;
  readonly unreadCount: number;
};

type ActivityAction =
  | { readonly type: "event"; readonly event: WebMcpExecutionEvent }
  | { readonly type: "open" }
  | { readonly type: "close" }
  | { readonly type: "select"; readonly executionId: string }
  | { readonly type: "clear" };

type ActivityContextValue = ActivityState & {
  readonly registrationState: WebMcpBridgeState;
  readonly openPanel: () => void;
  readonly closePanel: () => void;
  readonly clearEntries: () => void;
  readonly selectEntry: (executionId: string) => void;
};

type RecorderContextValue = {
  readonly observeExecution: WebMcpExecutionObserver;
  readonly setRegistrationState: (state: WebMcpBridgeState) => void;
};

const ActivityContext = createContext<ActivityContextValue | null>(null);
const RecorderContext = createContext<RecorderContextValue | null>(null);

const INITIAL_STATE: ActivityState = {
  entries: [],
  open: false,
  selectedId: null,
  unreadCount: 0,
};

function startedEntry(event: Extract<WebMcpExecutionEvent, { phase: "started" }>): WebMcpActivityEntry {
  return {
    executionId: event.executionId,
    toolName: event.toolName,
    toolTitle: event.toolTitle,
    readOnly: event.readOnly,
    startedAt: event.startedAt,
    input: event.input,
    phase: "started",
  };
}

function updateEntry(
  entry: WebMcpActivityEntry,
  event: Exclude<WebMcpExecutionEvent, { phase: "started" }>,
): WebMcpActivityEntry {
  if (entry.executionId !== event.executionId) return entry;
  if (event.phase === "returned") {
    return {
      ...entry,
      phase: "returned",
      finishedAt: event.finishedAt,
      durationMs: event.durationMs,
      result: event.result,
      applicationOutcome: event.applicationOutcome,
    };
  }
  return {
    ...entry,
    phase: "threw",
    finishedAt: event.finishedAt,
    durationMs: event.durationMs,
    error: event.error,
  };
}

function activityReducer(state: ActivityState, action: ActivityAction): ActivityState {
  if (action.type === "open") {
    return {
      ...state,
      open: true,
      selectedId: state.selectedId ?? state.entries[0]?.executionId ?? null,
      unreadCount: 0,
    };
  }
  if (action.type === "close") return { ...state, open: false };
  if (action.type === "select") return { ...state, selectedId: action.executionId };
  if (action.type === "clear") return { ...state, entries: [], selectedId: null, unreadCount: 0 };

  const { event } = action;
  if (event.phase !== "started") {
    return { ...state, entries: state.entries.map((entry) => updateEntry(entry, event)) };
  }

  const wasFollowingLatest = state.selectedId === null || state.selectedId === state.entries[0]?.executionId;
  const entries = [startedEntry(event), ...state.entries].slice(0, MAX_ACTIVITY_ENTRIES);
  return {
    ...state,
    entries,
    selectedId: state.open && wasFollowingLatest ? event.executionId : state.selectedId,
    unreadCount: state.open ? state.unreadCount : Math.min(state.unreadCount + 1, MAX_ACTIVITY_ENTRIES),
  };
}

export function WebMcpActivityProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(activityReducer, INITIAL_STATE);
  const [registrationState, setRegistrationStateValue] = useReducer(
    (_current: WebMcpBridgeState, next: WebMcpBridgeState) => next,
    "checking",
  );
  const observeExecution = useCallback<WebMcpExecutionObserver>((event) => {
    dispatch({ type: "event", event });
  }, []);
  const setRegistrationState = useCallback((next: WebMcpBridgeState) => {
    setRegistrationStateValue(next);
  }, []);
  const recorder = useMemo(
    () => ({ observeExecution, setRegistrationState }),
    [observeExecution, setRegistrationState],
  );
  const value = useMemo<ActivityContextValue>(() => ({
    ...state,
    registrationState,
    openPanel: () => dispatch({ type: "open" }),
    closePanel: () => dispatch({ type: "close" }),
    clearEntries: () => dispatch({ type: "clear" }),
    selectEntry: (executionId) => dispatch({ type: "select", executionId }),
  }), [registrationState, state]);

  return (
    <RecorderContext.Provider value={recorder}>
      <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>
    </RecorderContext.Provider>
  );
}

export function useWebMcpActivity(): ActivityContextValue {
  const value = useContext(ActivityContext);
  if (!value) throw new Error("useWebMcpActivity must be used inside WebMcpActivityProvider.");
  return value;
}

export function useWebMcpActivityRecorder(): RecorderContextValue {
  const value = useContext(RecorderContext);
  if (!value) throw new Error("useWebMcpActivityRecorder must be used inside WebMcpActivityProvider.");
  return value;
}
