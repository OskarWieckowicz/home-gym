"use client";

import { MapPin, Trash2 } from "lucide-react";
import { useState } from "react";

import { formatPricePln } from "@/features/catalog/components/catalog-formatters";
import type { Product } from "@/features/catalog/schemas";
import type { ProjectItem } from "@/features/project/schemas/project";

import { useProjectStore } from "../store/project-store-context";
import { FormActions } from "./form-controls";

export function ProjectItemForm({
  item,
  product,
  onPlace,
  onRemoved,
}: {
  readonly item: ProjectItem;
  readonly product: Pick<Product, "name" | "price" | "placementMode">;
  readonly onPlace: () => void;
  readonly onRemoved: () => void;
}) {
  const dispatch = useProjectStore((state) => state.dispatch);
  const [error, setError] = useState("");
  const canPlace = product.placementMode === "floor";

  return (
    <form className="creator-form" noValidate>
      <h2>Project equipment</h2>
      <p className="creator-entity-type">{product.name}</p>
      <dl className="creator-product-facts">
        <div><dt>Price</dt><dd>{formatPricePln(product.price)}</dd></div>
        <div><dt>Status</dt><dd>Unplaced</dd></div>
      </dl>
      {error ? <p className="creator-form-error" role="alert">{error}</p> : null}
      <FormActions>
        {canPlace ? (
          <button onClick={onPlace} type="button">
            <MapPin aria-hidden="true" size={16} /> Place on plan
          </button>
        ) : (
          <p className="creator-help">This accessory stays on the shopping list and cannot be placed on the floor.</p>
        )}
        <button
          className="creator-danger"
          onClick={() => {
            const result = dispatch({
              type: "PROJECT_ITEM_REMOVED",
              payload: { projectItemId: item.id },
            });
            if (result.ok) onRemoved();
            else setError(result.error.message);
          }}
          type="button"
        >
          <Trash2 aria-hidden="true" size={16} /> Remove from project
        </button>
      </FormActions>
    </form>
  );
}
