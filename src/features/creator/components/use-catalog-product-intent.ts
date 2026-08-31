"use client";

import { useEffect, useEffectEvent, useRef } from "react";

import { findProductById } from "@/features/catalog/queries/catalog";
import type { Product } from "@/features/catalog/schemas";

/** Mounted inside persistence: restoration must finish before selecting equipment. */
export function useCatalogProductIntent(
  productId: string | undefined,
  onSelect: (product: Product) => void,
) {
  const consumed = useRef<string | undefined>(undefined);
  const select = useEffectEvent(onSelect);

  useEffect(() => {
    if (!productId) {
      consumed.current = undefined;
      return;
    }
    let active = true;
    queueMicrotask(() => {
      if (!active || consumed.current === productId) return;
      const product = findProductById(productId);
      if (!product) return;
      consumed.current = productId;
      select(product);

      const url = new URL(window.location.href);
      const values = url.searchParams.getAll("product");
      if (values.length !== 1 || values[0] !== productId) return;
      url.searchParams.delete("product");
      // Native history keeps the project store, undo history and WebMCP tools mounted.
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
    });
    return () => { active = false; };
  }, [productId]);
}
