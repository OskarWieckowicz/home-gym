import type { ReactNode } from "react";

import { CatalogWebMcpBridge } from "@/features/webmcp/components/catalog-webmcp-bridge";

export default function CatalogLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <CatalogWebMcpBridge />
      {children}
    </>
  );
}
