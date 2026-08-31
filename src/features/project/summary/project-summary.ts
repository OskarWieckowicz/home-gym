import { calculateFloorArea } from "@/features/geometry/floor-area";
import { createRectangleFootprint } from "@/features/geometry/rectangles";
import { formatCatalogLabel, formatDimensions, formatPrice } from "@/shared/formatters/catalog-formatters";
import type { GymProject } from "../schemas/project";
import type { ProjectAnalysis } from "../validation/project-analysis";
import { describeValidationIssue } from "../validation/describe-validation-issue";
import type { ValidationIssue } from "../validation/validation-issues";
import { buildSummaryChecks } from "./project-summary-checks";
import { buildProjectShopping } from "./project-shopping";
import type { ProjectSummary, SummaryItem, SummaryProductResolver } from "./project-summary-types";

export type { ProjectSummary, SummaryProductResolver } from "./project-summary-types";

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function areaLabel(areaCm2: number): string {
  return `${new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 }).format(areaCm2 / 10_000)} m²`;
}

function buildItems(project: GymProject, analysis: ProjectAnalysis, resolveProduct: SummaryProductResolver): SummaryItem[] {
  const analyzedItems = new Map(analysis.items.map((item) => [item.id, item]));
  const placements = new Map(project.placements.map((placement) => [placement.projectItemId, placement]));
  return project.projectItems.map((item) => {
    const product = resolveProduct(item.productId);
    const analyzedItem = analyzedItems.get(item.id);
    const placement = placements.get(item.id);
    const price = analyzedItem?.price ?? null;
    const placed = placement !== undefined;
    const blockingIssueCodes = [...new Set(analysis.issues.filter((issue) =>
      issue.severity === "error" && issue.entityIds.some((id) => id === item.id || id === placement?.id),
    ).map(({ code }) => code))];
    const placementLabel = placed ? "Placed" : product?.placementMode === "selection-only" ? "No floor placement needed" : "Not placed";
    return {
      id: item.id,
      productId: item.productId,
      name: product?.name ?? "Unavailable product",
      useLabel: product ? product.trainingGoals.map(formatCatalogLabel).join(" · ") || product.exercises[0] || "Equipment" : "Product details unavailable",
      dimensions: product ? { ...product.dimensions } : null,
      dimensionsLabel: product ? formatDimensions(product.dimensions) : "Dimensions unavailable",
      price,
      priceLabel: price === null ? "Price unavailable" : formatPrice(price),
      placed,
      placementLabel,
      blockingIssueCodes,
    };
  });
}

function buildCoverage(analysis: ProjectAnalysis): ProjectSummary["coverage"] {
  const { requested, covered, uncovered } = analysis.coverage;
  return {
    requested: [...requested], covered: [...covered], uncovered: [...uncovered],
    requestedCount: requested.length, coveredCount: covered.length, uncoveredCount: uncovered.length,
    ratio: requested.length > 0 ? covered.length / requested.length : 0,
    label: requested.length > 0 ? `${covered.length} of ${requested.length} goals covered` : "No training goals selected",
    countLabel: requested.length > 0 ? `${covered.length}/${requested.length}` : "—",
    goals: requested.map((id) => ({
      id, label: formatCatalogLabel(id), covered: covered.includes(id),
      statusLabel: covered.includes(id) ? "Covered" : "Not covered",
    })),
  };
}

function buildFloor(project: GymProject, resolveProduct: SummaryProductResolver): ProjectSummary["floor"] {
  const items = new Map(project.projectItems.map((item) => [item.id, item]));
  let complete = true;
  const footprints = project.obstacles.map((obstacle) => createRectangleFootprint(obstacle.position, obstacle.dimensions, obstacle.rotation));
  for (const placement of project.placements) {
    const item = items.get(placement.projectItemId);
    const product = item ? resolveProduct(item.productId) : undefined;
    if (!product) {
      complete = false;
      continue;
    }
    if (product.mounting?.kind === "wall" && product.mounting.blocksFloor !== true) continue;
    footprints.push(createRectangleFootprint(placement.position, product.dimensions, placement.rotation));
  }
  // Doors/windows have no floor intrusion in the current domain model. Obstacles
  // include unavailable zones; overhead mounts and equipment use zones are excluded.
  const floor = calculateFloorArea(project.room, footprints);
  const freePercent = Math.round(floor.freeRatio * 100);
  return {
    roomAreaCm2: floor.roomAreaCm2,
    occupiedAreaCm2: complete ? floor.occupiedAreaCm2 : null,
    freeAreaCm2: complete ? floor.freeAreaCm2 : null,
    freeRatio: complete ? floor.freeRatio : null,
    freePercent: complete ? freePercent : null,
    complete,
    freeAreaLabel: complete ? areaLabel(floor.freeAreaCm2) : "Unknown",
    freePercentLabel: complete ? `${freePercent}%` : "Unknown",
  };
}

function issueDescriptions(issues: readonly ValidationIssue[], names: ReadonlyMap<string, string>) {
  return issues.map((issue, index) => ({
    id: `${issue.code}-${issue.entityIds.join("-")}-${index}`,
    code: issue.code,
    message: describeValidationIssue(issue, names),
  }));
}

/** A read-only, deterministic reporting contract shared by UI and WebMCP. */
export function buildProjectSummary(
  project: GymProject,
  analysis: ProjectAnalysis,
  resolveProduct: SummaryProductResolver,
): ProjectSummary {
  const items = buildItems(project, analysis, resolveProduct);
  const { totals } = buildProjectShopping(project, analysis, resolveProduct);
  const names = new Map([
    ...project.obstacles.map(({ id, name }) => [id, name] as const),
    ...project.wallElements.map(({ id, name }) => [id, name] as const),
    ...items.map(({ id, name }) => [id, name] as const),
  ]);
  for (const placement of project.placements) {
    names.set(placement.id, names.get(placement.projectItemId) ?? "Unavailable product");
  }
  const roomAreaCm2 = project.room.widthCm * project.room.depthCm;
  const errors = analysis.issues.filter(({ severity }) => severity === "error");
  const warnings = analysis.issues.filter(({ severity }) => severity === "warning");
  const statusLabel = !totals.complete ? "Product details unavailable" : !analysis.valid ? "Changes needed" : analysis.warningCount > 0 ? "Valid with recommendations" : "Layout valid";
  return {
    empty: items.length === 0,
    room: {
      ...project.room, areaCm2: roomAreaCm2, areaM2: roomAreaCm2 / 10_000,
      dimensionsLabel: formatDimensions(project.room), areaLabel: areaLabel(roomAreaCm2),
    },
    items, totals, coverage: buildCoverage(analysis), checks: buildSummaryChecks(analysis),
    recommendations: issueDescriptions(warnings, names), blockingIssues: issueDescriptions(errors, names),
    floor: buildFloor(project, resolveProduct),
    valid: analysis.valid, errorCount: analysis.errorCount, warningCount: analysis.warningCount,
    statusLabel,
    issueCountLabel: `${countLabel(analysis.errorCount, "error", "errors")}, ${countLabel(analysis.warningCount, "warning", "warnings")}`,
    physicalCollisionCount: analysis.issues.filter(({ code }) => code === "PHYSICAL_COLLISION").length,
  };
}
