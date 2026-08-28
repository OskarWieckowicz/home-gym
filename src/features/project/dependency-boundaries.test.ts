import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const FEATURES_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PURE_DOMAIN_DIRECTORIES = [
  join(FEATURES_ROOT, "geometry"),
  join(FEATURES_ROOT, "project"),
];

const FORBIDDEN_IMPORTS = [
  /from\s+["']react(?:\/[^"']*)?["']/,
  /from\s+["']zustand(?:\/[^"']*)?["']/,
  /from\s+["']three(?:\/[^"']*)?["']/,
  /from\s+["']next(?:\/[^"']*)?["']/,
  /from\s+["']@\/features\/(?:catalog|creator|webmcp)(?:\/[^"']*)?["']/,
  /from\s+["']@\/data(?:\/[^"']*)?["']/,
];

function listProductionTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return listProductionTypeScriptFiles(path);
    }
    return entry.name.endsWith(".ts") && !entry.name.endsWith(".test.ts")
      ? [path]
      : [];
  });
}

describe("pure domain dependency boundaries", () => {
  it("does not import UI, store, browser-framework, catalog, or WebMCP modules", () => {
    const violations = PURE_DOMAIN_DIRECTORIES.flatMap((directory) =>
      listProductionTypeScriptFiles(directory).flatMap((path) => {
        const source = readFileSync(path, "utf8");
        return FORBIDDEN_IMPORTS.filter((pattern) => pattern.test(source)).map(
          (pattern) => `${path}: ${pattern.source}`,
        );
      }),
    );

    expect(violations).toEqual([]);
  });
});
