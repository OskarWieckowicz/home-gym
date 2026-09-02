export function SceneZoneLegend({ showAll }: { readonly showAll: boolean }) {
  return <div className="creator-zone-legend" role="group" aria-label="Use and functional zone legend">
    <span><i className="is-use-zone" aria-hidden="true" />Use / furniture zone</span>
    <span><i className="is-unavailable" aria-hidden="true" />Unavailable zone</span>
    <span><i className="is-warning" aria-hidden="true" />Warning</span>
    <span><i className="is-error" aria-hidden="true" />Error</span>
    <span className="creator-zone-scope">{showAll ? "All zones" : "Selected & flagged items"}</span>
  </div>;
}
