"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { parseCreatorStartMode } from "@/lib/navigation";
import { CreatorEditor } from "./creator-editor";

/** A start request replaces a session; consuming its URL must not replace it again. */
export function CreatorEntry() {
  const params = useSearchParams();
  const values = params.getAll("start");
  const request = parseCreatorStartMode(values.length === 1 ? values[0] : null);
  const [session, setSession] = useState({ request, mode: request, id: 0 });

  if (request !== session.request) {
    setSession({
      request,
      mode: request ?? session.mode,
      id: request ? session.id + 1 : session.id,
    });
  }

  return <CreatorEditor key={session.id} startMode={session.mode ?? undefined} />;
}
