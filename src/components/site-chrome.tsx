"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The creator supplies its own compact application header. */
export function SiteChrome({ children }: { readonly children: ReactNode }) {
  return usePathname() === "/creator" ? null : children;
}
