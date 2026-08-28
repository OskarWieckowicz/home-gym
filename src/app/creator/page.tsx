import type { Metadata } from "next";

import { CreatorEditor } from "@/features/creator/components/creator-editor";

export const metadata: Metadata = {
  title: "Creator — Home Gym Creator",
  description:
    "Plan your home gym on a 2D floor plan, together with an AI agent that edits the same room model.",
};

export default function CreatorPage() {
  return <CreatorEditor />;
}
