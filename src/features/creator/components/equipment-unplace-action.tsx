"use client";

import { useId, useState } from "react";
import { useProjectStore } from "../store/project-store-context";

export function EquipmentUnplaceAction({ placementId, name, onUnplaced }: {
  readonly placementId: string;
  readonly name: string;
  readonly onUnplaced: () => void;
}) {
  const dispatch = useProjectStore((state) => state.dispatch);
  const [error, setError] = useState("");
  const hintId = useId();

  function unplace() {
    const result = dispatch({ type: "PLACEMENT_REMOVED", payload: { placementId } });
    if (result.ok) onUnplaced();
    else setError(result.error.message);
  }

  return <div className="creator-equipment-unplace">
    <button type="button" onClick={unplace} aria-describedby={hintId}>
      Remove from room, keep on list<span className="visually-hidden">: {name}</span>
    </button>
    <p id={hintId}>Total cost stays the same.</p>
    {error ? <p role="alert" className="creator-form-error">{error}</p> : null}
  </div>;
}
