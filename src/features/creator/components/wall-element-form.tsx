"use client";

import { useState, type FormEvent } from "react";

import { Trash2 } from "lucide-react";

import { wallElementPatchSchema } from "@/features/project/schemas/project-command";
import type { Wall, WallElement } from "@/features/project/schemas/project";

import { useProjectStore } from "../store/project-store-context";
import { FormActions, NumberField, readInteger } from "./form-controls";

const WALLS: readonly Wall[] = ["top", "right", "bottom", "left"];

export function WallElementForm({
  element,
  onRemoved,
}: {
  readonly element: WallElement;
  readonly onRemoved: () => void;
}) {
  const dispatch = useProjectStore((state) => state.dispatch);
  const revision = useProjectStore((state) => state.revision);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = wallElementPatchSchema.safeParse({
      name: String(data.get("name") ?? "").trim(),
      wall: data.get("wall") as Wall,
      offsetCm: readInteger(data, "offsetCm"),
      widthCm: readInteger(data, "widthCm"),
    });
    if (!parsed.success) {
      setError("Use a name, a wall, and positive whole centimeter values.");
      return;
    }
    const result = dispatch({
      type: "WALL_ELEMENT_UPDATED",
      payload: { wallElementId: element.id, patch: parsed.data },
    });
    setError(result.ok ? "" : result.error.message);
  }

  return (
    <form className="creator-form" key={`${element.id}-${revision}`} noValidate onSubmit={submit}>
      <h2>Selected wall element</h2>
      <p className="creator-entity-type">{element.kind === "door" ? "Door" : "Window"}</p>
      <p className="creator-help">Wall elements do not create an unavailable zone.</p>
      <div className="creator-field">
        <label htmlFor="wall-element-name">Name</label>
        <input defaultValue={element.name} id="wall-element-name" maxLength={80} name="name" required />
      </div>
      <div className="creator-field-grid">
        <div className="creator-field">
          <label htmlFor="wall-element-wall">Wall</label>
          <select defaultValue={element.wall} id="wall-element-wall" name="wall">
            {WALLS.map((wall) => <option key={wall} value={wall}>{wall}</option>)}
          </select>
        </div>
        <NumberField defaultValue={element.offsetCm} id="wall-element-offset" label="Offset (cm)" min="0" name="offsetCm" step="1" />
        <NumberField defaultValue={element.widthCm} id="wall-element-width" label="Width (cm)" min="1" name="widthCm" step="1" />
      </div>
      {error ? <p className="creator-form-error" role="alert">{error}</p> : null}
      <FormActions>
        <button className="creator-primary" type="submit">Apply changes</button>
        <button className="creator-danger" onClick={() => {
          const result = dispatch({
            type: "WALL_ELEMENT_REMOVED",
            payload: { wallElementId: element.id },
          });
          if (result.ok) onRemoved();
        }} type="button">
          <Trash2 aria-hidden="true" size={16} /> Remove
        </button>
      </FormActions>
    </form>
  );
}
