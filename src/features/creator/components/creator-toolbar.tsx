"use client";

import { CircleHelp } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { LinkButton } from "@/components/ui/link-button";
import { siteLinks } from "@/lib/navigation";

import { useProjectPersistence } from "../persistence/project-persistence-boundary";
import { ProjectFileActions } from "./project-file-actions";
import { EditorPopover } from "./editor-popover";

export function CreatorToolbar({ onOpenSettings }: { readonly onOpenSettings: (trigger: HTMLButtonElement) => void }) {
  const persistence = useProjectPersistence();

  return (
    <header className="creator-toolbar">
      <div className="creator-project-identity">
        <BrandMark />
        <div>
        <h1>Untitled room</h1>
        {persistence ? (
          <p
            aria-live="polite"
            className={`creator-persistence-status is-${persistence.status.kind}`}
            role="status"
          >
            {persistence.status.message}
          </p>
        ) : null}
        </div>
      </div>
      <div className="creator-toolbar-actions" aria-label="Project controls" role="group">
        <ProjectFileActions onOpenSettings={onOpenSettings} />
        <LinkButton href={siteLinks.viewSummary.href}>{siteLinks.viewSummary.label}</LinkButton>
        <EditorPopover label="Editor help" icon={<CircleHelp aria-hidden="true" size={19} />}>
          <strong>Make room for your training</strong>
          <p>Choose equipment or a room tool, then click to place it. You can also use Place at centre.</p>
          <p>Click an item to select it. Drag the selected item to move it; drag elsewhere to orbit. Scroll to zoom.</p>
          <p>Use the lists and Properties for keyboard editing. Escape cancels placement. 2D is always available.</p>
        </EditorPopover>
      </div>
    </header>
  );
}
