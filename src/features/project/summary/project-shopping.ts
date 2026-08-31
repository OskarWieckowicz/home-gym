import { formatPricePln } from "@/shared/formatters/catalog-formatters";
import type { GymProject } from "../schemas/project";
import type { ProjectAnalysis } from "../validation/project-analysis";
import type { ProjectSummary, SummaryProductResolver } from "./project-summary-types";

export type ShoppingItem = {
  readonly id: string;
  readonly productId: string;
  readonly price: number | null;
  readonly priceLabel: string;
  readonly placed: boolean;
  readonly placementRequired: boolean | null;
  readonly placementLabel: string;
  readonly detailsAvailable: boolean;
};
export type PendingPlacementSummary = {
  readonly count: number;
  readonly totalPrice: number;
  readonly complete: boolean;
  readonly totalPriceLabel: string;
};
export type ProductShoppingCount = {
  readonly itemCount: number;
  readonly placedCount: number;
  readonly pendingCount: number;
};
export type ProjectShopping = {
  readonly items: readonly ShoppingItem[];
  readonly totals: ProjectSummary["totals"];
  readonly pending: PendingPlacementSummary;
  readonly byProduct: ReadonlyMap<string, ProductShoppingCount>;
};

function buildTotals(project: GymProject, items: readonly ShoppingItem[]): ProjectSummary["totals"] {
  const totalPrice = items.reduce((total, item) => total + (item.price ?? 0), 0);
  const unavailableCount = items.filter((item) => item.price === null || !item.detailsAvailable).length;
  const complete = unavailableCount === 0;
  const remainingBudget = Math.max(0, project.budget - totalPrice);
  const excessBudget = Math.max(0, totalPrice - project.budget);
  const overBudget = excessBudget > 0;
  const placedCount = items.filter((item) => item.placed).length;
  // Zero budget is a real zero, not an unset value; keep the payload JSON-safe.
  const budgetUsedRatio = project.budget > 0 ? totalPrice / project.budget : totalPrice > 0 ? 1 : 0;
  return {
    itemCount: items.length, placedCount, unplacedCount: items.length - placedCount,
    unavailableCount, totalPrice, budget: project.budget, remainingBudget, excessBudget,
    overBudget, budgetUsedRatio, budgetUsedPercent: Math.min(100, budgetUsedRatio * 100),
    totalPriceLabel: `${formatPricePln(totalPrice)}${complete ? "" : " (known prices only)"}`,
    budgetLabel: formatPricePln(project.budget),
    balanceLabel: complete
      ? `${formatPricePln(overBudget ? excessBudget : remainingBudget)} ${overBudget ? "over budget" : "remaining"}`
      : "Budget total incomplete: some product details are unavailable",
    itemCountLabel: `${items.length} ${items.length === 1 ? "item" : "items"}`, complete,
  };
}

/** Lightweight shopping facts; does not run geometry or validation again. */
export function buildProjectShopping(
  project: GymProject,
  analysis: ProjectAnalysis,
  resolveProduct: SummaryProductResolver,
): ProjectShopping {
  const analyzedItems = new Map(analysis.items.map((item) => [item.id, item]));
  const placedIds = new Set(project.placements.map(({ projectItemId }) => projectItemId));
  const byProduct = new Map<string, ProductShoppingCount>();
  const items = project.projectItems.map((item): ShoppingItem => {
    const product = resolveProduct(item.productId);
    const price = analyzedItems.get(item.id)?.price ?? null;
    const placed = placedIds.has(item.id);
    const placementRequired = product ? product.placementMode === "floor" : null;
    const count = byProduct.get(item.productId) ?? { itemCount: 0, placedCount: 0, pendingCount: 0 };
    byProduct.set(item.productId, {
      itemCount: count.itemCount + 1,
      placedCount: count.placedCount + Number(placed),
      pendingCount: count.pendingCount + Number(placementRequired === true && !placed),
    });
    return {
      ...item, price, priceLabel: price === null ? "Price unavailable" : formatPricePln(price),
      placed, placementRequired, detailsAvailable: product !== undefined,
      placementLabel: placed ? "Placed" : placementRequired === false ? "No placement needed" : "Not placed",
    };
  });
  const pendingItems = items.filter((item) => item.placementRequired === true && !item.placed);
  const totalPrice = pendingItems.reduce((sum, item) => sum + (item.price ?? 0), 0);
  const complete = pendingItems.every((item) => item.price !== null);
  return {
    items, byProduct, totals: buildTotals(project, items),
    pending: {
      count: pendingItems.length, totalPrice, complete,
      totalPriceLabel: `${formatPricePln(totalPrice)}${complete ? "" : " (known prices only)"}`,
    },
  };
}
