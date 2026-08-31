import { useMemo } from "react";
import { findProjectProductById } from "@/features/catalog/queries/project-products";
import { buildProjectShopping } from "@/features/project/summary/project-shopping";
import { useProjectStore } from "./project-store-context";

export function useProjectShopping() {
  const project = useProjectStore((state) => state.project);
  const analysis = useProjectStore((state) => state.validation);
  return useMemo(
    () => buildProjectShopping(project, analysis, findProjectProductById),
    [project, analysis],
  );
}
