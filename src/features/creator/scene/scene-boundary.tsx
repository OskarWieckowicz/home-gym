"use client";

import { useThree } from "@react-three/fiber";
import { Component, useEffect, type ReactNode } from "react";

export function SceneRecovery({ onFallback, message = "The 3D view is unavailable. Your project and undo history are safe." }: {
  readonly onFallback: () => void;
  readonly message?: string;
}) {
  return <div className="creator-scene-recovery" role="alert">
    <p>{message}</p>
    <button type="button" onClick={onFallback}>Continue in 2D</button>
  </div>;
}

/** Wrap the Canvas, never the shared store, bridge or editor toolbar. No automatic retry. */
export class SceneBoundary extends Component<{
  readonly children: ReactNode;
  readonly onFallback: () => void;
  readonly onFailure?: () => void;
}, { readonly failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onFailure?.();
  }

  render() {
    return this.state.failed ? <SceneRecovery onFallback={this.props.onFallback} /> : this.props.children;
  }
}

/** Rendering errors cross the Canvas boundary; context-loss events require a DOM listener. */
export function SceneContextLoss({ onContextLost }: { readonly onContextLost: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);
  useEffect(() => {
    const lost = (event: Event) => {
      event.preventDefault();
      onContextLost();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [canvas, onContextLost]);
  return null;
}
