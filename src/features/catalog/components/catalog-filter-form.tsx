import Link from "next/link";

import { buttonClassName } from "@/components/ui/button-styles";
import {
  PRODUCT_CATEGORIES,
  TRAINING_GOALS,
} from "@/features/catalog/schemas";
import { routes } from "@/lib/navigation";

import { formatCatalogLabel } from "./catalog-formatters";

type CatalogFilterFormProps = {
  readonly values: {
    readonly query?: string;
    readonly category?: string;
    readonly maxPrice?: number;
    readonly trainingGoal?: string;
  };
  readonly hasActiveFilters: boolean;
};

const FIELD_CLASSES =
  "mt-1.5 w-full rounded-lg border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-muted";

export function CatalogFilterForm({
  values,
  hasActiveFilters,
}: CatalogFilterFormProps) {
  return (
    <form action={routes.catalog} className="space-y-5" method="get">
      <div>
        <label className="text-sm font-semibold text-ink" htmlFor="query">
          Search
        </label>
        <input
          className={FIELD_CLASSES}
          defaultValue={values.query}
          id="query"
          name="query"
          placeholder="Name, brand, exercise…"
          type="search"
        />
      </div>

      <div>
        <label className="text-sm font-semibold text-ink" htmlFor="category">
          Category
        </label>
        <select
          className={FIELD_CLASSES}
          defaultValue={values.category ?? ""}
          id="category"
          name="category"
        >
          <option value="">All categories</option>
          {PRODUCT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {formatCatalogLabel(category)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-ink" htmlFor="trainingGoal">
          Training goal
        </label>
        <select
          className={FIELD_CLASSES}
          defaultValue={values.trainingGoal ?? ""}
          id="trainingGoal"
          name="trainingGoal"
        >
          <option value="">All goals</option>
          {TRAINING_GOALS.map((goal) => (
            <option key={goal} value={goal}>
              {formatCatalogLabel(goal)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-semibold text-ink" htmlFor="maxPrice">
          Maximum price (PLN)
        </label>
        <input
          className={FIELD_CLASSES}
          defaultValue={values.maxPrice}
          id="maxPrice"
          inputMode="numeric"
          min="0"
          name="maxPrice"
          placeholder="e.g. 2500"
          step="1"
          type="number"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={buttonClassName("primary")} type="submit">
          Apply filters
        </button>
        {hasActiveFilters ? (
          <Link
            className={buttonClassName("secondary")}
            href={routes.catalog}
          >
            Clear
          </Link>
        ) : null}
      </div>
    </form>
  );
}
