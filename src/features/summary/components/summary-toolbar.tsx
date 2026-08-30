"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, Pencil } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { downloadProject } from "@/features/creator/persistence/export-project";
import { useProjectStore } from "@/features/creator/store/project-store-context";
import { routes, siteLinks } from "@/lib/navigation";

export function SummaryToolbar() {
  const project = useProjectStore((state) => state.project);
  const [message, setMessage] = useState<ReturnType<typeof downloadProject> | null>(null);
  return <header className="summary-toolbar">
    <a className="visually-hidden summary-skip" href="#summary-content">Skip to summary</a>
    <BrandMark />
    <nav aria-label="Project">
      <Link href={routes.creator}>Creator</Link>
      <Link href={routes.catalog}>Catalog</Link>
      <Link href={routes.summary} aria-current="page">Summary</Link>
    </nav>
    <div className="summary-toolbar-actions">
      <Button variant="secondary" onClick={() => setMessage(downloadProject(project))}>
        <Download size={17} aria-hidden="true" /> Export project
      </Button>
      <LinkButton href={siteLinks.backToEditing.href}>
        <Pencil size={17} aria-hidden="true" /> {siteLinks.backToEditing.label}
      </LinkButton>
    </div>
    {message ? <p className="summary-export-status" role={message.kind === "error" ? "alert" : "status"}>{message.text}</p> : null}
  </header>;
}
