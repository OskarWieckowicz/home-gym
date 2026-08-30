import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { SceneEditController, type SceneControllerOptions } from "./scene-edit-controller";
import type { ProjectStore } from "../store/project-store";
import type { SceneProjectPointer } from "./scene-editor-types";

export function useSceneEditing(store: ProjectStore, options: SceneControllerOptions) {
  const [controller] = useState(() => new SceneEditController(store, options));
  const projectPointerRef = useRef<SceneProjectPointer | null>(null);
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  useLayoutEffect(() => { controller.configure(options); });
  useEffect(() => {
    const disconnect = controller.connect();
    const blur = () => controller.dispose();
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || (event.target instanceof Element && event.target.closest("input,textarea,select,[contenteditable=true]"))) return;
      controller.cancelPlacement();
    };
    // Captured releases reach the scene first. Afterwards clear ownership even off-canvas.
    const release = (event: PointerEvent) => controller.pointerCancel(event.pointerId);
    const outsidePointer = (event: PointerEvent) => {
      if (controller.hasActivePointer()) controller.pointerDown(event, null, () => () => undefined);
    };
    window.addEventListener("blur", blur);
    window.addEventListener("keydown", key);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    window.addEventListener("pointerdown", outsidePointer);
    return () => {
      disconnect();
      window.removeEventListener("blur", blur);
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("pointerdown", outsidePointer);
      controller.dispose();
    };
  }, [controller]);
  return { controller, projectPointerRef, snapshot };
}
