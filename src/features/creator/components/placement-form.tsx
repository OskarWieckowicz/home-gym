"use client";

import { RotateCw, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";

import { formatDimensions, formatPricePln } from "@/features/catalog/components/catalog-formatters";
import { getEffectiveMounting } from "@/features/catalog/queries";
import type { Product } from "@/features/catalog/schemas";
import { getMountedWall } from "@/features/geometry/wall-mounting";
import type { Rotation } from "@/features/project/schemas/geometry";
import { placementPatchSchema } from "@/features/project/schemas/project-command";
import type { Placement } from "@/features/project/schemas/project";

import { useProjectStore } from "../store/project-store-context";
import { FormActions, NumberField, readInteger } from "./form-controls";

export function PlacementForm({
  placement,
  product,
  onRemoved,
}: {
  readonly placement: Placement;
  readonly product: Product;
  readonly onRemoved: () => void;
}) {
  const dispatch = useProjectStore((state) => state.dispatch);
  const revision = useProjectStore((state) => state.revision);
  const [error, setError] = useState("");
  const mounting = getEffectiveMounting(product);

  function update(patch: Record<string, unknown>) {
    const result = dispatch({
      type: "PLACEMENT_UPDATED",
      payload: { placementId: placement.id, patch },
    });
    setError(result.ok ? "" : result.error.message);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = placementPatchSchema.safeParse({
      position: {
        xCm: readInteger(data, "xCm"),
        zCm: readInteger(data, "zCm"),
      },
      rotation: readInteger(data, "rotation"),
    });
    if (!parsed.success) {
      setError("Use whole centimeter values and one of the available rotations.");
      return;
    }
    update(parsed.data);
  }

  function nudge(xCm: number, zCm: number) {
    update({
      position: {
        xCm: Math.max(0, placement.position.xCm + xCm),
        zCm: Math.max(0, placement.position.zCm + zCm),
      },
    });
  }

  return (
    <form className="creator-form" key={`${placement.id}-${revision}`} noValidate onSubmit={submit}>
      <h2>Selected equipment</h2>
      <p className="creator-entity-type">{product.name}</p>
      <dl className="creator-product-facts">
        <div><dt>Price</dt><dd>{formatPricePln(product.price)}</dd></div>
        <div><dt>Dimensions</dt><dd>{formatDimensions(product.dimensions)}</dd></div>
        {mounting.kind === "wall" ? (
          <div>
            <dt>Mounting</dt>
            <dd>
              Mounted on the {getMountedWall(placement.rotation)} wall at {mounting.bottomHeightCm} cm
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="creator-field-grid">
        <NumberField defaultValue={placement.position.xCm} id="placement-x" label="X (cm)" min="0" name="xCm" step="1" />
        <NumberField defaultValue={placement.position.zCm} id="placement-z" label="Z (cm)" min="0" name="zCm" step="1" />
        <div className="creator-field">
          <label htmlFor="placement-rotation">Rotation</label>
          <select defaultValue={placement.rotation} id="placement-rotation" name="rotation">
            {[0, 90, 180, 270].map((value) => <option key={value} value={value}>{value}°</option>)}
          </select>
        </div>
      </div>
      {error ? <p className="creator-form-error" role="alert">{error}</p> : null}
      <FormActions>
        <button className="creator-primary" type="submit">Apply changes</button>
        <button onClick={() => update({ rotation: ((placement.rotation + 90) % 360) as Rotation })} type="button">
          <RotateCw aria-hidden="true" size={16} /> Rotate 90°
        </button>
        <button className="creator-danger" onClick={() => {
          const result = dispatch({
            type: "PLACEMENT_REMOVED",
            payload: { placementId: placement.id },
          });
          if (result.ok) onRemoved();
          else setError(result.error.message);
        }} type="button">
          <Trash2 aria-hidden="true" size={16} /> Remove
        </button>
      </FormActions>
      <fieldset className="creator-nudge">
        <legend>Move by 10 cm</legend>
        <button onClick={() => nudge(0, -10)} type="button">Up</button>
        <button onClick={() => nudge(-10, 0)} type="button">Left</button>
        <button onClick={() => nudge(0, 10)} type="button">Down</button>
        <button onClick={() => nudge(10, 0)} type="button">Right</button>
      </fieldset>
    </form>
  );
}
