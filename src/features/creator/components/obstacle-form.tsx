"use client";

import { useState, type FormEvent } from "react";

import { RotateCw, Trash2 } from "lucide-react";

import type { Rotation } from "@/features/project/schemas/geometry";
import {
  obstacleInputSchema,
  obstaclePatchSchema,
} from "@/features/project/schemas/project-command";
import type { Obstacle, ObstacleKind } from "@/features/project/schemas/project";

import { useProjectStore } from "../store/project-store-context";
import { FormActions, NumberField, readInteger } from "./form-controls";

type ObstacleFormProps =
  | { readonly mode: "add"; readonly onCreated: (id: string) => void }
  | { readonly mode: "edit"; readonly obstacle: Obstacle; readonly onRemoved: () => void };

const DEFAULTS = {
  kind: "obstacle",
  name: "Wardrobe",
  position: { xCm: 20, zCm: 20 },
  dimensions: { widthCm: 100, depthCm: 50, heightCm: 200 },
  rotation: 0,
  locked: false,
} as const;

export function ObstacleForm(props: ObstacleFormProps) {
  const dispatch = useProjectStore((state) => state.dispatch);
  const revision = useProjectStore((state) => state.revision);
  const obstacle = props.mode === "edit" ? props.obstacle : DEFAULTS;
  const [error, setError] = useState("");
  const formKey = `${props.mode}-${revision}-${props.mode === "edit" ? props.obstacle.id : "new"}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const value = {
      kind: data.get("kind") as ObstacleKind,
      name: String(data.get("name") ?? "").trim(),
      position: { xCm: readInteger(data, "xCm"), zCm: readInteger(data, "zCm") },
      dimensions: {
        widthCm: readInteger(data, "widthCm"),
        depthCm: readInteger(data, "depthCm"),
        heightCm: readInteger(data, "heightCm"),
      },
      rotation: readInteger(data, "rotation") as Rotation,
      locked: data.get("locked") === "on",
    };
    const parsed = props.mode === "add"
      ? obstacleInputSchema.safeParse(value)
      : obstaclePatchSchema.safeParse(value);
    if (!parsed.success) {
      setError("Use a name, whole centimeter values, and one of the available rotations.");
      return;
    }
    const result = props.mode === "add"
      ? dispatch({ type: "OBSTACLE_ADDED", payload: parsed.data })
      : dispatch({
          type: "OBSTACLE_UPDATED",
          payload: { obstacleId: props.obstacle.id, patch: parsed.data },
        });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    setError("");
    if (props.mode === "add" && result.affectedEntityIds[0]) {
      props.onCreated(result.affectedEntityIds[0]);
    }
  }

  function update(patch: Record<string, unknown>) {
    if (props.mode !== "edit") return;
    const result = dispatch({
      type: "OBSTACLE_UPDATED",
      payload: { obstacleId: props.obstacle.id, patch },
    });
    if (!result.ok) setError(result.error.message);
  }

  const locked = props.mode === "edit" && props.obstacle.locked;
  return (
    <form className="creator-form" key={formKey} noValidate onSubmit={submit}>
      <h2>{props.mode === "add" ? "Add an area" : "Selected area"}</h2>
      {locked ? <p className="creator-lock-note">Locked areas must be unlocked before editing.</p> : null}
      <div className="creator-field">
        <label htmlFor={`${props.mode}-kind`}>Type</label>
        <select defaultValue={obstacle.kind} disabled={locked} id={`${props.mode}-kind`} name="kind">
          <option value="obstacle">Physical obstacle</option>
          <option value="unavailable-zone">Unavailable zone</option>
        </select>
      </div>
      <div className="creator-field">
        <label htmlFor={`${props.mode}-name`}>Name</label>
        <input defaultValue={obstacle.name} disabled={locked} id={`${props.mode}-name`} maxLength={80} name="name" required />
      </div>
      <div className="creator-field-grid">
        <NumberField defaultValue={obstacle.position.xCm} disabled={locked} id={`${props.mode}-x`} label="X (cm)" min="0" name="xCm" step="1" />
        <NumberField defaultValue={obstacle.position.zCm} disabled={locked} id={`${props.mode}-z`} label="Z (cm)" min="0" name="zCm" step="1" />
        <NumberField defaultValue={obstacle.dimensions.widthCm} disabled={locked} id={`${props.mode}-width`} label="Width (cm)" min="1" name="widthCm" step="1" />
        <NumberField defaultValue={obstacle.dimensions.depthCm} disabled={locked} id={`${props.mode}-depth`} label="Depth (cm)" min="1" name="depthCm" step="1" />
        <NumberField defaultValue={obstacle.dimensions.heightCm} disabled={locked} id={`${props.mode}-height`} label="Height (cm)" min="1" name="heightCm" step="1" />
        <div className="creator-field">
          <label htmlFor={`${props.mode}-rotation`}>Rotation</label>
          <select defaultValue={obstacle.rotation} disabled={locked} id={`${props.mode}-rotation`} name="rotation">
            {[0, 90, 180, 270].map((value) => <option key={value} value={value}>{value}°</option>)}
          </select>
        </div>
      </div>
      <label className="creator-lock-check">
        <input defaultChecked={obstacle.locked} disabled={locked} name="locked" type="checkbox" /> Lock after applying
      </label>
      {error ? <p className="creator-form-error" role="alert">{error}</p> : null}
      <FormActions>
        {locked ? (
          <button onClick={() => update({ locked: false })} type="button">Unlock</button>
        ) : (
          <button className="creator-primary" type="submit">{props.mode === "add" ? "Add to room" : "Apply changes"}</button>
        )}
        {props.mode === "edit" && !locked ? (
          <>
            <button onClick={() => update({ rotation: ((props.obstacle.rotation + 90) % 360) as Rotation })} type="button">
              <RotateCw aria-hidden="true" size={16} /> Rotate 90°
            </button>
            <button className="creator-danger" onClick={() => {
              const result = dispatch({ type: "OBSTACLE_REMOVED", payload: { obstacleId: props.obstacle.id } });
              if (result.ok) props.onRemoved();
            }} type="button">
              <Trash2 aria-hidden="true" size={16} /> Remove
            </button>
          </>
        ) : null}
      </FormActions>
      {props.mode === "edit" && !locked ? (
        <fieldset className="creator-nudge">
          <legend>Move by 10 cm</legend>
          <button onClick={() => update({ position: { ...props.obstacle.position, zCm: Math.max(0, props.obstacle.position.zCm - 10) } })} type="button">Up</button>
          <button onClick={() => update({ position: { ...props.obstacle.position, xCm: Math.max(0, props.obstacle.position.xCm - 10) } })} type="button">Left</button>
          <button onClick={() => update({ position: { ...props.obstacle.position, zCm: props.obstacle.position.zCm + 10 } })} type="button">Down</button>
          <button onClick={() => update({ position: { ...props.obstacle.position, xCm: props.obstacle.position.xCm + 10 } })} type="button">Right</button>
        </fieldset>
      ) : null}
    </form>
  );
}
