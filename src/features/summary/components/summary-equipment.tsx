import { Card } from "@/components/ui/card";
import type { ProjectSummary } from "@/features/project/summary/project-summary";
import type { PendingPlacementSummary } from "@/features/project/summary/project-shopping";
import { PendingPlacementNotice } from "@/features/creator/components/pending-placement-notice";

export function SummaryEquipment({ summary, pending }: { readonly summary: ProjectSummary; readonly pending: PendingPlacementSummary }) {
  return <Card className="summary-card">
    <h2>Equipment list</h2>
    <PendingPlacementNotice pending={pending} />
    <div className="summary-table-scroll" role="region" aria-label="Equipment list" tabIndex={0}>
      <table className="summary-table">
        <caption className="visually-hidden">Selected equipment, price and placement status</caption>
        <thead><tr><th scope="col">Product</th><th scope="col">Use</th><th scope="col">Dimensions</th><th scope="col">Price</th><th scope="col">Placement</th></tr></thead>
        <tbody>{summary.items.map((item) => <tr key={item.id}>
          <th scope="row">{item.name}</th>
          <td>{item.useLabel}</td>
          <td>{item.dimensionsLabel}</td>
          <td className="summary-price">{item.priceLabel}</td>
          <td>{item.placementLabel}</td>
        </tr>)}</tbody>
        <tfoot><tr><th scope="row" colSpan={3}>Total</th><td className="summary-price">{summary.totals.totalPriceLabel}</td><td>{summary.totals.itemCountLabel}</td></tr></tfoot>
      </table>
    </div>
    {!summary.totals.complete ? <p className="summary-note">Some products are unavailable. The known-price total is incomplete.</p> : null}
  </Card>;
}
