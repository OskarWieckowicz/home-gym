import type { Metadata } from "next";
import { Suspense } from "react";

import { CreatorEntry } from "@/features/creator/components/creator-entry";

export const metadata: Metadata = {
  title: "Creator — Home Gym Creator",
  description:
    "Plan your home gym on a 2D floor plan, together with an AI agent that edits the same room model.",
};

export default function CreatorPage() {
  return (
    <Suspense fallback={<p role="status">Loading room editor…</p>}>
      <CreatorEntry />
    </Suspense>
  );
}
