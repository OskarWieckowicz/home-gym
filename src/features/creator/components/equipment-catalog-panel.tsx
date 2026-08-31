"use client";

import { useEffect, useId, useMemo, useRef, useState, type DragEvent } from "react";
import { Search } from "lucide-react";

import { catalogProducts } from "@/data/products";
import { formatCatalogLabel, formatFootprint, formatPricePln } from "@/features/catalog/components/catalog-formatters";
import { findProductById, searchProducts } from "@/features/catalog/queries/catalog";
import { PRODUCT_CATEGORIES } from "@/features/catalog/schemas";
import { useProjectShopping } from "../store/use-project-shopping";

import { EquipmentCatalogThumb } from "./equipment-catalog-thumb";

export const EQUIPMENT_DRAG_TYPE = "application/x-home-gym-product-id";

export function EquipmentCatalogPanel({
  initialProductId,
  activeProductId,
  onActivate,
  onAdd,
}: {
  readonly initialProductId?: string;
  readonly activeProductId: string | null;
  readonly onActivate: (productId: string) => void;
  readonly onAdd: (productId: string) => void;
}) {
  const [query, setQuery] = useState(() => initialProductId ? findProductById(initialProductId)?.name ?? "" : "");
  const requestedAction = useRef<HTMLButtonElement>(null);
  const [category, setCategory] = useState("");
  const searchId = useId();
  const categoryId = useId();
  const { byProduct } = useProjectShopping();
  const products = useMemo(() => searchProducts({ query, category }), [query, category]);

  useEffect(() => {
    if (initialProductId) requestedAction.current?.focus();
  }, [initialProductId]);

  function startDrag(event: DragEvent<HTMLElement>, productId: string) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(EQUIPMENT_DRAG_TYPE, productId);
  }

  return (
    <section className="creator-equipment-catalog" aria-labelledby="equipment-catalog-title">
      <h3 id="equipment-catalog-title">Equipment catalog</h3>
      <label className="creator-catalog-search" htmlFor={searchId}>
        <span className="visually-hidden">Search equipment</span>
        <Search aria-hidden="true" size={16} />
        <input
          id={searchId}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search equipment"
          type="search"
          value={query}
        />
      </label>
      <label className="creator-catalog-category" htmlFor={categoryId}>
        <span className="visually-hidden">Equipment category</span>
        <select id={categoryId} value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">All equipment</option>
          {PRODUCT_CATEGORIES.map((value) => (
            <option key={value} value={value}>{formatCatalogLabel(value)}</option>
          ))}
        </select>
      </label>
      <p className="creator-catalog-count">
        {products.length} of {catalogProducts.length} products
      </p>
      {products.length ? (
        <ul>
          {products.map((product) => {
            const canPlace = product.placementMode === "floor";
            const counts = byProduct.get(product.id);
            const reuseExisting = canPlace && (counts?.pendingCount ?? 0) > 0;
            const hintId = `${searchId}-${product.id}-reuse`;
            return (
              <li
                className={canPlace ? undefined : "is-selection-only"}
                draggable={canPlace}
                key={product.id}
                onDragStart={canPlace ? (event) => startDrag(event, product.id) : undefined}
              >
                <div className="creator-catalog-product">
                  <EquipmentCatalogThumb productId={product.id} />
                  <span>
                    <strong>{product.name}</strong>
                    <small>
                      {canPlace ? formatFootprint(product.dimensions) : "No floor placement needed"}
                      {" · "}
                      {formatPricePln(product.price)}
                    </small>
                  </span>
                </div>
                {counts ? <p className="creator-catalog-quantity">
                  {counts.itemCount} in project{counts.pendingCount > 0 ? ` · ${counts.pendingCount} not placed` : ""}
                </p> : null}
                {reuseExisting ? <p className="creator-catalog-reuse" id={hintId}>Places an item already on your list</p> : null}
                <div className="creator-catalog-actions">
                  {canPlace ? (
                    <button
                      ref={product.id === initialProductId ? requestedAction : undefined}
                      aria-label={`${activeProductId === product.id ? "Cancel placing" : "Place"} ${product.name}`}
                      aria-pressed={activeProductId === product.id}
                      aria-describedby={reuseExisting ? hintId : undefined}
                      onClick={() => onActivate(product.id)}
                      type="button"
                    >
                      {activeProductId === product.id ? "Cancel" : "Place"}
                    </button>
                  ) : <button
                    ref={product.id === initialProductId ? requestedAction : undefined}
                    aria-label={`Add to list: ${product.name}`}
                    onClick={() => onAdd(product.id)}
                    type="button"
                  >
                    Add to list
                  </button>}
                </div>
              </li>
            );
          })}
        </ul>
      ) : <p>No equipment matches this search.</p>}
    </section>
  );
}
