import type { LocalProjectStorage } from "@/features/creator/persistence/local-project-storage";
import {
  catalogProductResolver,
  projectUsesKnownProducts,
} from "@/features/creator/store/catalog-product-resolver";
import { reconcileCatalogProject } from "@/features/creator/store/reconcile-catalog-project";
import type { GymProject } from "@/features/project/schemas/project";

export type SavedCatalogProject =
  | { readonly kind: "saved"; readonly project: GymProject }
  | { readonly kind: "missing" | "invalid" | "unavailable" };

/** Read the same durable model as the creator, without initializing or saving a session. */
export function readSavedCatalogProject(storage: Pick<LocalProjectStorage, "load">): SavedCatalogProject {
  const result = storage.load();
  if (result.status === "missing") return { kind: "missing" };
  if (result.status === "failure") {
    const unavailable = result.error.code === "storage-unavailable" || result.error.code === "read-failed";
    return { kind: unavailable ? "unavailable" : "invalid" };
  }

  const project = reconcileCatalogProject(result.project, catalogProductResolver);
  return projectUsesKnownProducts(project, catalogProductResolver)
    ? { kind: "saved", project }
    : { kind: "invalid" };
}
