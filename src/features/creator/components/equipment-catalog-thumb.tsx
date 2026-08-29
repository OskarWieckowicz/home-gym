"use client";

import { Dumbbell } from "lucide-react";
import Image from "next/image";

import { getProductImage } from "@/features/catalog/product-assets";

const THUMB_SIZE_PX = 44;

export function EquipmentCatalogThumb({ productId }: { readonly productId: string }) {
  const src = getProductImage(productId);
  if (!src) {
    return (
      <span className="creator-catalog-thumb creator-catalog-thumb-fallback">
        <Dumbbell aria-hidden="true" size={17} />
      </span>
    );
  }

  return (
    <span className="creator-catalog-thumb">
      <Image alt="" height={THUMB_SIZE_PX} sizes={`${THUMB_SIZE_PX}px`} src={src} width={THUMB_SIZE_PX} />
    </span>
  );
}
