"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { parseCreatorStartMode } from "@/lib/navigation";
import { findProductById } from "@/features/catalog/queries/catalog";
import { CreatorEditor } from "./creator-editor";

/** A start request replaces a session; consuming its URL must not replace it again. */
export function CreatorEntry() {
  const params = useSearchParams();
  const values = params.getAll("start");
  const request = parseCreatorStartMode(values.length === 1 ? values[0] : null);
  const productValues = params.getAll("product");
  const productId = productValues.length === 1
    ? findProductById(productValues[0])?.id
    : undefined;
  const [session, setSession] = useState({ request, mode: request, id: 0 });

  if (request !== session.request) {
    setSession({
      request,
      mode: request ?? session.mode,
      id: request ? session.id + 1 : session.id,
    });
  }

  return <CreatorEditor key={session.id} startMode={session.mode ?? undefined} catalogProductId={productId} />;
}
