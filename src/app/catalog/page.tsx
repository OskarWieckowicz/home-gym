import type { Metadata } from "next";

import { UnderConstruction } from "@/components/under-construction";
import { siteLinks } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Equipment — Home Gym Creator",
  description:
    "Browse fictional home gym equipment with dimensions, clearance zones, and training goals.",
};

export default function CatalogPage() {
  return (
    <UnderConstruction
      eyebrow="Equipment"
      title="A catalog measured for the space it needs."
      description="Every product carries its footprint, the clearance it needs for safe use, its price, and the exercises it supports. The planner and the agent read the same records."
      upcoming={[
        "Fictional catalog of racks, benches, barbells, plates, cardio, and accessories",
        "Filtering by price, dimensions, training goal, exercise, and ceiling height",
        "Product pages with clearance zones and installation requirements",
      ]}
      action={siteLinks.openCreator}
    />
  );
}
