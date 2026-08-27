import type { Metadata } from "next";

import { UnderConstruction } from "@/components/under-construction";
import { siteLinks } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Creator — Home Gym Creator",
  description:
    "Plan your home gym on a 2D floor plan, together with an AI agent that edits the same room model.",
};

export default function CreatorPage() {
  return (
    <UnderConstruction
      eyebrow="Creator"
      title="The shared editor lands here."
      description="This route hosts the room plan, the property panel, and the WebMCP tools. A person and an agent will edit one project through the same domain commands, with the same undo history."
      upcoming={[
        "Editable room, obstacles, and door swing zones",
        "Drag and rotate equipment on a 10 cm grid with clearance zones shown",
        "Deterministic collision, clearance, ceiling height, and budget validation",
        "WebMCP tools so an agent can read and change the open project",
      ]}
      action={siteLinks.catalog}
    />
  );
}
