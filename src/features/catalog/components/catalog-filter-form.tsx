import Link from "next/link";

import { buttonClassName } from "@/components/ui/button-styles";
import type { NormalizedCatalogFilters } from "@/features/catalog/queries";
import {
  ANCHORING_FILTER_VALUES,
  PRODUCT_CATEGORIES,
  TRAINING_GOALS,
} from "@/features/catalog/schemas";
import { routes } from "@/lib/navigation";

import { formatCatalogLabel } from "./catalog-formatters";

export const CATALOG_FILTER_FORM_ID = "catalog-filters";

type CatalogFilterFormProps = {
  readonly values: NormalizedCatalogFilters;
  readonly exerciseOptions: readonly string[];
  readonly hasActiveFilters: boolean;
};

const FIELD_CLASSES =
  "mt-2 min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink shadow-card outline-none transition focus:border-brand focus:ring-2 focus:ring-brand-muted";

const SECTION_CLASSES = "border-b border-line-strong pb-5";

type NumberFieldProps = {
  readonly defaultValue?: number;
  readonly id: string;
  readonly label: string;
  readonly name: string;
  readonly placeholder: string;
};

function NumberField({ defaultValue, id, label, name, placeholder }: NumberFieldProps) {
  return (
    <div>
      <label className="text-xs font-medium text-ink-muted" htmlFor={id}>
        {label}
      </label>
      <input
        className={FIELD_CLASSES}
        defaultValue={defaultValue}
        id={id}
        inputMode="numeric"
        min="0"
        name={name}
        placeholder={placeholder}
        step="1"
        type="number"
      />
    </div>
  );
}

type RadioFilterProps = {
  readonly checked: boolean;
  readonly label: string;
  readonly name: string;
  readonly value: string;
};

function RadioFilter({ checked, label, name, value }: RadioFilterProps) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
      <input
        className="size-4 accent-brand"
        defaultChecked={checked}
        name={name}
        type="radio"
        value={value}
      />
      <span>{label}</span>
    </label>
  );
}

function FilterHeading({ children }: { readonly children: string }) {
  return <legend className="text-sm font-bold text-ink">{children}</legend>;
}

export function CatalogFilterForm({
  values,
  exerciseOptions,
  hasActiveFilters,
}: CatalogFilterFormProps) {
  return (
    <form action={routes.catalog} className="space-y-5" id={CATALOG_FILTER_FORM_ID} method="get">
      <fieldset className={SECTION_CLASSES}>
        <FilterHeading>Price</FilterHeading>
        <div className="mt-3 grid gap-4">
          <NumberField
            defaultValue={values.maxPrice}
            id="maxPrice"
            label="Maximum price (USD)"
            name="maxPrice"
            placeholder="No limit"
          />
        </div>
      </fieldset>

      <fieldset className={SECTION_CLASSES}>
        <FilterHeading>Maximum equipment dimensions</FilterHeading>
        <p className="mt-2 text-xs leading-5 text-ink-muted">
          Physical size only; exercise space is shown on each product.
        </p>
        <div className="mt-3 grid gap-3">
          <NumberField
            defaultValue={values.maxWidthCm}
            id="maxWidthCm"
            label="Width (cm)"
            name="maxWidthCm"
            placeholder="Width up to"
          />
          <NumberField
            defaultValue={values.maxDepthCm}
            id="maxDepthCm"
            label="Depth (cm)"
            name="maxDepthCm"
            placeholder="Depth up to"
          />
          <NumberField
            defaultValue={values.maxHeightCm}
            id="maxHeightCm"
            label="Product height (cm)"
            name="maxHeightCm"
            placeholder="Height up to"
          />
        </div>
      </fieldset>

      <details className={SECTION_CLASSES} open={Boolean(values.category)}>
        <summary className="cursor-pointer rounded-sm text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-brand">
          Category
        </summary>
        <fieldset>
          <legend className="sr-only">Category</legend>
          <div className="mt-3 grid gap-1">
            <RadioFilter checked={!values.category} label="All categories" name="category" value="" />
            {PRODUCT_CATEGORIES.map((category) => (
              <RadioFilter
                checked={values.category === category}
                key={category}
                label={formatCatalogLabel(category)}
                name="category"
                value={category}
              />
            ))}
          </div>
        </fieldset>
      </details>

      <details className={SECTION_CLASSES} open={Boolean(values.trainingGoal)}>
        <summary className="cursor-pointer rounded-sm text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-brand">
          Training goal
        </summary>
        <fieldset>
          <legend className="sr-only">Training goal</legend>
          <div className="mt-3 grid gap-1">
            <RadioFilter
              checked={!values.trainingGoal}
              label="All goals"
              name="trainingGoal"
              value=""
            />
            {TRAINING_GOALS.map((goal) => (
              <RadioFilter
                checked={values.trainingGoal === goal}
                key={goal}
                label={formatCatalogLabel(goal)}
                name="trainingGoal"
                value={goal}
              />
            ))}
          </div>
        </fieldset>
      </details>

      <details className={SECTION_CLASSES} open={Boolean(values.exercise)}>
        <summary className="cursor-pointer rounded-sm text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-brand">
          Exercise
        </summary>
        <div className="mt-3">
          <div>
            <label className="text-xs font-medium text-ink-muted" htmlFor="exercise">
              Exercise
            </label>
            <select
              className={FIELD_CLASSES}
              defaultValue={values.exercise ?? ""}
              id="exercise"
              name="exercise"
            >
              <option value="">All exercises</option>
              {exerciseOptions.map((exercise) => (
                <option key={exercise} value={exercise}>
                  {formatCatalogLabel(exercise)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </details>

      <details className={SECTION_CLASSES} open={values.availableCeilingHeightCm !== undefined || Boolean(values.anchoring)}>
        <summary className="cursor-pointer rounded-sm text-sm font-bold text-ink focus-visible:outline-2 focus-visible:outline-brand">
          Requirements
        </summary>
        <fieldset>
          <legend className="sr-only">Requirements</legend>
          <div className="mt-3 grid gap-4">
            <NumberField
              defaultValue={values.availableCeilingHeightCm}
              id="availableCeilingHeightCm"
              label="Available ceiling height (cm)"
              name="availableCeilingHeightCm"
              placeholder="Ceiling height"
            />
            <div>
              <label className="text-xs font-medium text-ink-muted" htmlFor="anchoring">
                Anchoring
              </label>
              <select
                className={FIELD_CLASSES}
                defaultValue={values.anchoring ?? ""}
                id="anchoring"
                name="anchoring"
              >
                <option value="">Any requirement</option>
                {ANCHORING_FILTER_VALUES.map((anchoring) => (
                  <option key={anchoring} value={anchoring}>
                    {anchoring === "none" ? "No anchoring" : formatCatalogLabel(anchoring)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </fieldset>
      </details>

      <div className="grid gap-2">
        <button className={buttonClassName("primary", "w-full")} type="submit">
          Apply filters
        </button>
        {hasActiveFilters ? (
          <Link className={buttonClassName("secondary", "w-full")} href={routes.catalog}>
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
