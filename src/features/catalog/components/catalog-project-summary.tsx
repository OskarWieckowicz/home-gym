"use client";

import { DoorOpen } from "lucide-react";
import { useEffect, useState } from "react";

import { LinkButton } from "@/components/ui/link-button";
import {
  createLocalProjectStorage,
  LOCAL_PROJECT_STORAGE_KEY,
} from "@/features/creator/persistence/local-project-storage";
import { routes } from "@/lib/navigation";

import { readSavedCatalogProject, type SavedCatalogProject } from "../saved-catalog-project";
import { formatDimensions, formatPrice } from "./catalog-formatters";

function loadBrowserProject(): SavedCatalogProject {
  try {
    return readSavedCatalogProject(createLocalProjectStorage(window.localStorage));
  } catch {
    return { kind: "unavailable" };
  }
}

const PROJECT_MESSAGES = {
  loading: "Checking for a project saved in this browser…",
  missing: "No saved project yet. Set your room and budget in the creator to start planning.",
  invalid: "Your saved project could not be restored. Open the creator to review recovery options.",
  unavailable: "Saved project unavailable. Browser storage could not be accessed; you can still use the creator.",
} as const;

export function CatalogProjectSummary() {
  const [snapshot, setSnapshot] = useState<SavedCatalogProject | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = () => {
      if (active) setSnapshot(loadBrowserProject());
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === LOCAL_PROJECT_STORAGE_KEY) refresh();
    };
    queueMicrotask(refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const project = snapshot?.kind === "saved" ? snapshot.project : null;
  const message = snapshot?.kind === "saved" ? "loading" : snapshot?.kind ?? "loading";

  return (
    <section aria-labelledby="catalog-project-heading" className="flex min-w-0 flex-col gap-4 rounded-lg border border-line-strong bg-surface-muted p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <DoorOpen aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brass-strong" />
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-ink" id="catalog-project-heading">
            {project ? "Your saved project" : "Plan around your room"}
          </h2>
          {project ? (
            <>
              <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div>
                  <dt className="text-xs text-ink-muted">Room · W × D × H</dt>
                  <dd className="mt-0.5 font-medium text-ink">{formatDimensions(project.room)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Budget</dt>
                  <dd className="mt-0.5 font-medium text-ink">{formatPrice(project.budget)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-muted">Selected equipment</dt>
                  <dd className="mt-0.5 font-medium text-ink">
                    {project.projectItems.length} {project.projectItems.length === 1 ? "item" : "items"}
                  </dd>
                </div>
              </dl>
              <p className="mt-2 text-xs text-ink-muted">Saved in this browser. Includes unplaced equipment and accessories.</p>
            </>
          ) : (
            <p className="mt-1 max-w-xl text-sm leading-5 text-ink-muted">{PROJECT_MESSAGES[message]}</p>
          )}
        </div>
      </div>
      <LinkButton className="shrink-0" href={routes.creator} variant="secondary">
        {project ? "Continue project" : "Open creator"}
      </LinkButton>
    </section>
  );
}
