import type { Dimensions } from "../schemas/geometry";
import type { Room } from "../schemas/project";
import type { TrainingGoalCoverage } from "../validation/project-analysis";
import type { ProductMountingFact } from "../validation/product-validation";
import type { ValidationIssue } from "../validation/validation-issues";
import type { TrainingGoal } from "@/shared/schemas/training-goal";

export type SummaryProduct = {
  readonly name: string;
  readonly dimensions: Dimensions;
  readonly trainingGoals: readonly TrainingGoal[];
  readonly exercises: readonly string[];
  readonly placementMode: "floor" | "selection-only";
  readonly mounting?: ProductMountingFact;
};
export type SummaryProductResolver = (productId: string) => SummaryProduct | undefined;
type IssueCode = ValidationIssue["code"];

export type SummaryItem = {
  readonly id: string;
  readonly productId: string;
  readonly name: string;
  readonly useLabel: string;
  readonly dimensions: Dimensions | null;
  readonly dimensionsLabel: string;
  readonly price: number | null;
  readonly priceLabel: string;
  readonly placed: boolean;
  readonly placementLabel: string;
  readonly blockingIssueCodes: readonly IssueCode[];
};
export type SummaryCheck = {
  readonly id: "physical-collisions" | "use-zones" | "room-bounds" | "budget" | "access";
  readonly label: string;
  readonly passed: boolean;
  readonly statusLabel: string;
  readonly issueCodes: readonly IssueCode[];
};
export type SummaryIssue = { readonly id: string; readonly code: IssueCode; readonly message: string };

export type ProjectSummary = {
  readonly empty: boolean;
  readonly room: Room & {
    readonly areaCm2: number;
    readonly areaM2: number;
    readonly dimensionsLabel: string;
    readonly areaLabel: string;
  };
  readonly items: readonly SummaryItem[];
  readonly totals: {
    readonly itemCount: number;
    readonly placedCount: number;
    readonly unplacedCount: number;
    readonly unavailableCount: number;
    readonly totalPrice: number;
    readonly budget: number;
    readonly remainingBudget: number;
    readonly excessBudget: number;
    readonly overBudget: boolean;
    readonly budgetUsedRatio: number;
    readonly budgetUsedPercent: number;
    readonly totalPriceLabel: string;
    readonly budgetLabel: string;
    readonly balanceLabel: string;
    readonly itemCountLabel: string;
    readonly complete: boolean;
  };
  readonly coverage: TrainingGoalCoverage & {
    readonly requestedCount: number;
    readonly coveredCount: number;
    readonly uncoveredCount: number;
    readonly ratio: number;
    readonly label: string;
    readonly countLabel: string;
    readonly goals: readonly {
      readonly id: TrainingGoal;
      readonly label: string;
      readonly covered: boolean;
      readonly statusLabel: string;
    }[];
  };
  readonly checks: readonly SummaryCheck[];
  readonly recommendations: readonly SummaryIssue[];
  readonly blockingIssues: readonly SummaryIssue[];
  readonly floor: {
    readonly roomAreaCm2: number;
    readonly occupiedAreaCm2: number | null;
    readonly freeAreaCm2: number | null;
    readonly freeRatio: number | null;
    readonly freePercent: number | null;
    readonly freeAreaLabel: string;
    readonly freePercentLabel: string;
    readonly complete: boolean;
  };
  readonly valid: boolean;
  readonly errorCount: number;
  readonly warningCount: number;
  readonly statusLabel: string;
  readonly issueCountLabel: string;
  readonly physicalCollisionCount: number;
};
