"use client";

import { useState, type ReactNode } from "react";

export function CatalogFiltersDisclosure({ children }: { readonly children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <h2 className="mb-5 hidden text-lg font-bold text-ink lg:block" id="filters-heading">
        Filters
      </h2>
      <button
        aria-controls="catalog-filter-fields"
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between rounded-sm text-left font-bold text-ink focus-visible:outline-2 focus-visible:outline-brand lg:hidden"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        Filters
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      <div className={`${open ? "block" : "hidden"} pt-4 lg:block lg:pt-0`} id="catalog-filter-fields">
        {children}
      </div>
    </>
  );
}
