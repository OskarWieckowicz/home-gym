import type { Position } from "@/features/project/schemas/geometry";

export type SceneClientPoint = { readonly x: number; readonly y: number };
export type SceneEditSession = {
  readonly pointerId: number;
  readonly revision: number;
  readonly entityId: string | null;
  readonly startClient: SceneClientPoint;
  readonly startPoint: Position;
  readonly point: Position;
  readonly dragging: boolean;
};
export const SCENE_DRAG_THRESHOLD_PX = 5;

export function createSceneEditSession(input: {
  pointerId: number;
  revision: number;
  client: SceneClientPoint;
  point: Position;
  entityId: string | null;
}): SceneEditSession {
  return { pointerId: input.pointerId, revision: input.revision, entityId: input.entityId,
    startClient: input.client, startPoint: input.point, point: input.point, dragging: false };
}

export function advanceSceneEditSession(
  session: SceneEditSession,
  input: { pointerId: number; revision: number; client: SceneClientPoint; point: Position },
): SceneEditSession | null {
  if (session.revision !== input.revision) return null;
  if (session.pointerId !== input.pointerId) return session;
  const distance = Math.hypot(input.client.x - session.startClient.x, input.client.y - session.startClient.y);
  return { ...session, point: input.point, dragging: session.dragging || distance >= SCENE_DRAG_THRESHOLD_PX };
}

/** This only authorizes a release; the owner must clear its session before dispatching once. */
export function finishSceneEditSession(
  session: SceneEditSession,
  input: { pointerId: number; revision: number; inside: boolean },
): { kind: "click" | "drag"; point: Position; entityId: string | null } | null {
  if (!input.inside || session.pointerId !== input.pointerId || session.revision !== input.revision) return null;
  return { kind: session.dragging ? "drag" : "click", point: session.point, entityId: session.entityId };
}
