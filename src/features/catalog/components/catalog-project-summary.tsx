import { DoorOpen, Dumbbell } from "lucide-react";

import { Card } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { siteLinks } from "@/lib/navigation";

export function CatalogProjectSummary() {
  return (
    <Card className="p-5 xl:sticky xl:top-24">
      <h2 className="text-xl font-bold text-ink">Your project</h2>

      <div className="mt-6 flex items-center gap-3">
        <span className="grid size-14 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
          <Dumbbell aria-hidden="true" className="size-6" />
        </span>
        <div>
          <p className="font-semibold text-ink">Home gym</p>
          <p className="mt-1 text-sm leading-5 text-ink-muted">
            Room dimensions and budget live in the creator.
          </p>
        </div>
      </div>

      <div className="my-6 border-t border-line" />

      <h3 className="font-bold text-ink">Selected equipment</h3>
      <div className="mt-3 rounded-lg border border-dashed border-line bg-surface-muted p-4 text-center">
        <DoorOpen aria-hidden="true" className="mx-auto size-6 text-ink-subtle" />
        <p className="mt-2 text-sm font-semibold text-ink">Build your room first</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          Equipment selection will appear here when room placement is available.
        </p>
      </div>

      <LinkButton className="mt-6 w-full" href={siteLinks.openCreator.href} variant="secondary">
        Open creator
      </LinkButton>
    </Card>
  );
}
