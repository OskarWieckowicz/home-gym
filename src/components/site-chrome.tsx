"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Application destinations supply their own compact header. */
export function SiteChrome({ children }: { readonly children: ReactNode }) {
  const pathname = usePathname();
  return pathname === "/creator" || pathname === "/summary" ? null : children;
}
