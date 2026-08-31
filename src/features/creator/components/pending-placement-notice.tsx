import type { PendingPlacementSummary } from "@/features/project/summary/project-shopping";

export function PendingPlacementNotice({ pending }: { readonly pending: PendingPlacementSummary }) {
  if (pending.count === 0) return null;
  return <p className="pending-placement-notice">
    <strong>{pending.count} {pending.count === 1 ? "item" : "items"} not placed.</strong>{" "}
    {pending.totalPriceLabel} already included in the total cost.
  </p>;
}
