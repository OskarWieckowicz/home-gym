"use client";

import { useState, type FormEvent } from "react";

import { RotateCw, Trash2 } from "lucide-react";

import type { Rotation } from "@/features/project/schemas/geometry";
import { obstaclePatchSchema } from "@/features/project/schemas/project-command";
import type { Obstacle } from "@/features/project/schemas/project";

import { useProjectStore } from "../store/project-store-context";
import { FormActions, NumberField, readInteger } from "./form-controls";

export function ObstacleForm({
  obstacle,
  onRemoved,
}: {
  readonly obstacle: Obstacle;
  readonly onRemoved: () => void;
}) {
  const dispatch = useProjectStore((state) => state.dispatch);
  const revision = useProjectStore((state) => state.revision);
  const [error, setError] = useState("");
  const locked = obstacle.locked;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const dimensions = obstacle.kind === "obstacle"
      ? {
          widthCm: readInteger(data, "widthCm"),
          depthCm: readInteger(data, "depthCm"),
          heightCm: readInteger(data, "heightCm"),
        }
      : {
          widthCm: readInteger(data, "widthCm"),
          depthCm: readInteger(data, "depthCm"),
        };
    const functionalClearance = obstacle.kind === "obstacle"
      ? {
          frontCm: readInteger(data, "functionalFrontCm"),
          backCm: readInteger(data, "functionalBackCm"),
          leftCm: readInteger(data, "functionalLeftCm"),
          rightCm: readInteger(data, "functionalRightCm"),
        }
      : undefined;
    const parsed = obstaclePatchSchema.safeParse({
      name: String(data.get("name") ?? "").trim(),
      position: { xCm: readInteger(data, "xCm"), zCm: readInteger(data, "zCm") },
      dimensions,
      ...(functionalClearance ? { functionalClearance } : {}),
      rotation: readInteger(data, "rotation") as Rotation,
      locked: data.get("locked") === "on",
    });
    if (!parsed.success) {
      setError("Use a name, whole centimeter values, and one of the available rotations.");
      return;
    }
    const result = dispatch({
      type: "OBSTACLE_UPDATED",
      payload: { obstacleId: obstacle.id, patch: parsed.data },
    });
    setError(result.ok ? "" : result.error.message);
  }

  function update(patch: Record<string, unknown>) {
    const result = dispatch({
      type: "OBSTACLE_UPDATED",
      payload: { obstacleId: obstacle.id, patch },
    });
    if (!result.ok) setError(result.error.message);
  }

  return (
    <form className="creator-form" key={`${obstacle.id}-${revision}`} noValidate onSubmit={submit}>
      <h2>Selected area</h2>
      <p className="creator-entity-type">{obstacle.kind === "obstacle" ? "Physical obstacle" : "Unavailable zone"}</p>
      {locked ? <p className="creator-lock-note">Locked areas must be unlocked before editing.</p> : null}
      <div className="creator-field">
        <label htmlFor="selected-name">Name</label>
        <input defaultValue={obstacle.name} disabled={locked} id="selected-name" maxLength={80} name="name" required />
      </div>
      <div className="creator-field-grid">
        <NumberField defaultValue={obstacle.position.xCm} disabled={locked} id="selected-x" label="X (cm)" min="0" name="xCm" step="1" />
        <NumberField defaultValue={obstacle.position.zCm} disabled={locked} id="selected-z" label="Z (cm)" min="0" name="zCm" step="1" />
        <NumberField defaultValue={obstacle.dimensions.widthCm} disabled={locked} id="selected-width" label="Width (cm)" min="1" name="widthCm" step="1" />
        <NumberField defaultValue={obstacle.dimensions.depthCm} disabled={locked} id="selected-depth" label="Depth (cm)" min="1" name="depthCm" step="1" />
        {obstacle.kind === "obstacle" ? (
          <NumberField defaultValue={obstacle.dimensions.heightCm} disabled={locked} id="selected-height" label="Height (cm)" min="1" name="heightCm" step="1" />
        ) : null}
        <div className="creator-field">
          <label htmlFor="selected-rotation">Rotation</label>
          <select defaultValue={obstacle.rotation} disabled={locked} id="selected-rotation" name="rotation">
            {[0, 90, 180, 270].map((value) => <option key={value} value={value}>{value}°</option>)}
          </select>
        </div>
      </div>
      {obstacle.kind === "obstacle" ? (
        <fieldset className="creator-clearance-fields">
          <legend>Space needed to use this furniture</legend>
          <p className="creator-help">
            Enter measured margins relative to the furniture’s current front. They rotate with it; zero means not specified.
          </p>
          <div className="creator-field-grid">
            <NumberField defaultValue={obstacle.functionalClearance.frontCm} disabled={locked} id="selected-functional-front" label="Front (cm)" min="0" name="functionalFrontCm" step="1" />
            <NumberField defaultValue={obstacle.functionalClearance.backCm} disabled={locked} id="selected-functional-back" label="Back (cm)" min="0" name="functionalBackCm" step="1" />
            <NumberField defaultValue={obstacle.functionalClearance.leftCm} disabled={locked} id="selected-functional-left" label="Left (cm)" min="0" name="functionalLeftCm" step="1" />
            <NumberField defaultValue={obstacle.functionalClearance.rightCm} disabled={locked} id="selected-functional-right" label="Right (cm)" min="0" name="functionalRightCm" step="1" />
          </div>
        </fieldset>
      ) : null}
      <label className="creator-lock-check">
        <input defaultChecked={obstacle.locked} disabled={locked} name="locked" type="checkbox" /> Lock after applying
      </label>
      {error ? <p className="creator-form-error" role="alert">{error}</p> : null}
      <FormActions>
        {locked ? (
          <button onClick={() => update({ locked: false })} type="button">Unlock</button>
        ) : (
          <button className="creator-primary" type="submit">Apply changes</button>
        )}
        {!locked ? (
          <>
            <button onClick={() => update({ rotation: ((obstacle.rotation + 90) % 360) as Rotation })} type="button">
              <RotateCw aria-hidden="true" size={16} /> Rotate 90°
            </button>
            <button className="creator-danger" onClick={() => {
              const result = dispatch({ type: "OBSTACLE_REMOVED", payload: { obstacleId: obstacle.id } });
              if (result.ok) onRemoved();
            }} type="button">
              <Trash2 aria-hidden="true" size={16} /> Remove
            </button>
          </>
        ) : null}
      </FormActions>
      {!locked ? (
        <fieldset className="creator-nudge">
          <legend>Move by 10 cm</legend>
          <button onClick={() => update({ position: { ...obstacle.position, zCm: Math.max(0, obstacle.position.zCm - 10) } })} type="button">Up</button>
          <button onClick={() => update({ position: { ...obstacle.position, xCm: Math.max(0, obstacle.position.xCm - 10) } })} type="button">Left</button>
          <button onClick={() => update({ position: { ...obstacle.position, zCm: obstacle.position.zCm + 10 } })} type="button">Down</button>
          <button onClick={() => update({ position: { ...obstacle.position, xCm: obstacle.position.xCm + 10 } })} type="button">Right</button>
        </fieldset>
      ) : null}
    </form>
  );
}
