import { Button } from "@/components/ui/button";
import { useProjectStore } from "../store/project-store-context";
import { useProjectShopping } from "../store/use-project-shopping";
import { GOAL_LABELS } from "../training-goal-labels";

type ProjectCostProps = {
  readonly onEditBudget: (trigger: HTMLButtonElement) => void;
  readonly onEditGoals: (trigger: HTMLButtonElement) => void;
};

export function ProjectCost({ onEditBudget, onEditGoals }: ProjectCostProps) {
  const { totals } = useProjectShopping();
  const goals = useProjectStore((state) => state.project.trainingGoals);
  return <section className="creator-project-cost">
    <div className="creator-project-cost-heading">
      <h2>Project cost</h2>
      <Button variant="quiet" onClick={(event) => onEditBudget(event.currentTarget)}>Edit budget</Button>
    </div>
    <div role="status" aria-live="polite" aria-atomic="true">
      <p className="creator-project-cost-total">{totals.totalPriceLabel}</p>
      <p className="creator-project-cost-budget">Budget: {totals.budgetLabel}</p>
      <p className={`creator-project-cost-balance${totals.overBudget ? " creator-project-cost-over" : ""}`}>{totals.balanceLabel}</p>
    </div>
    <div className="creator-project-goals">
      <div className="creator-project-goals-heading">
        <h2>Training goals</h2>
        <Button
          variant="quiet"
          aria-label={goals.length > 0 ? "Edit training goals" : "Set training goals"}
          onClick={(event) => onEditGoals(event.currentTarget)}
        >
          {goals.length > 0 ? "Edit" : "Set training goals"}
        </Button>
      </div>
      {goals.length > 0
        ? <p className="creator-project-goals-summary">{goals.map((goal) => GOAL_LABELS[goal]).join(" · ")}</p>
        : null}
    </div>
  </section>;
}
