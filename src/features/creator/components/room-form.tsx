"use client";

import { useState, type FormEvent } from "react";

import { roomSchema } from "@/features/project/schemas/project";

import { useProjectStore } from "../store/project-store-context";
import { FormActions, NumberField, readInteger } from "./form-controls";

export function RoomForm() {
  const room = useProjectStore((state) => state.project.room);
  const revision = useProjectStore((state) => state.revision);
  const dispatch = useProjectStore((state) => state.dispatch);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = roomSchema.safeParse({
      widthCm: readInteger(data, "widthCm"),
      depthCm: readInteger(data, "depthCm"),
      heightCm: readInteger(data, "heightCm"),
    });
    if (!parsed.success) {
      setError("Enter positive whole centimeters for every room dimension.");
      return;
    }
    setError("");
    dispatch({ type: "ROOM_CONFIGURED", payload: parsed.data });
  }

  return (
    <form className="creator-form" key={revision} noValidate onSubmit={submit}>
      <h2>Room dimensions</h2>
      <p className="creator-help">The plan uses centimeters and preserves exact values.</p>
      <div className="creator-field-grid">
        <NumberField defaultValue={room.widthCm} id="room-width" label="Width (cm)" min="1" name="widthCm" step="1" />
        <NumberField defaultValue={room.depthCm} id="room-depth" label="Depth (cm)" min="1" name="depthCm" step="1" />
        <NumberField defaultValue={room.heightCm} id="room-height" label="Height (cm)" min="1" name="heightCm" step="1" />
      </div>
      {error ? <p className="creator-form-error" role="alert">{error}</p> : null}
      <FormActions><button className="creator-primary" type="submit">Apply room</button></FormActions>
    </form>
  );
}
