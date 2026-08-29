"use client";

import { useMemo, useState, type DragEvent } from "react";
import { Dumbbell, Search } from "lucide-react";

import { catalogProducts } from "@/data/products";
import { formatFootprint, formatPricePln } from "@/features/catalog/components/catalog-formatters";
import { searchProducts } from "@/features/catalog/queries/catalog";

export const EQUIPMENT_DRAG_TYPE = "application/x-home-gym-product-id";
const RESULT_LIMIT = 8;

export function EquipmentCatalogPanel({
  activeProductId,
  onActivate,
}: {
  readonly activeProductId: string | null;
  readonly onActivate: (productId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const products = useMemo(() => searchProducts({ query }), [query]);
  const visibleProducts = products.slice(0, RESULT_LIMIT);

  function startDrag(event: DragEvent<HTMLElement>, productId: string) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(EQUIPMENT_DRAG_TYPE, productId);
  }

  return (
    <section className="creator-equipment-catalog" aria-labelledby="equipment-catalog-title">
      <h3 id="equipment-catalog-title">Equipment catalog</h3>
      <label className="creator-catalog-search">
        <span className="visually-hidden">Search equipment</span>
        <Search aria-hidden="true" size={16} />
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search equipment"
          type="search"
          value={query}
        />
      </label>
      <p className="creator-catalog-count">
        {products.length} of {catalogProducts.length} products
      </p>
      {visibleProducts.length ? (
        <ul>
          {visibleProducts.map((product) => (
            <li
              draggable
              key={product.id}
              onDragStart={(event) => startDrag(event, product.id)}
            >
              <div>
                <Dumbbell aria-hidden="true" size={17} />
                <span>
                  <strong>{product.name}</strong>
                  <small>{formatFootprint(product.dimensions)} · {formatPricePln(product.price)}</small>
                </span>
              </div>
              <button
                aria-label={`${activeProductId === product.id ? "Cancel placing" : "Place"} ${product.name}`}
                aria-pressed={activeProductId === product.id}
                onClick={() => onActivate(product.id)}
                type="button"
              >
                {activeProductId === product.id ? "Cancel" : "Place"}
              </button>
            </li>
          ))}
        </ul>
      ) : <p>No equipment matches this search.</p>}
      {products.length > RESULT_LIMIT ? (
        <p className="creator-catalog-count">Refine the search to see the remaining products.</p>
      ) : null}
    </section>
  );
}
