import { describe, expect, it } from "vitest";
import { z } from "zod";

import { layoutChangesInputSchema, layoutChangesJsonSchema } from "./batch-tool-schemas";

describe("batch JSON Schema references", () => {
  it("uses self-contained references without changing the expanded input contract", () => {
    const schema = JSON.parse(JSON.stringify(layoutChangesJsonSchema));
    let referenceCount = 0;

    function expand(value: unknown): unknown {
      if (Array.isArray(value)) return value.map(expand);
      if (value === null || typeof value !== "object") return value;

      const { $ref, $defs: definitions, ...fields } = value as Record<string, unknown>;
      const expanded = Object.fromEntries(
        Object.entries(fields).map(([key, child]) => [key, expand(child)]),
      );
      // Definitions belong to the document root, not the expanded input shape.
      if (definitions !== undefined) expect(value).toBe(schema);
      if ($ref === undefined) return expanded;

      expect($ref).toBeTypeOf("string");
      expect($ref).toMatch(/^#\/\$defs\/[^/]+$/);
      const key = ($ref as string).slice("#/$defs/".length);
      expect(Object.hasOwn(schema.$defs, key)).toBe(true);
      referenceCount += 1;
      return { ...expand(schema.$defs[key]) as Record<string, unknown>, ...expanded };
    }

    expect(expand(schema)).toEqual(z.toJSONSchema(layoutChangesInputSchema, { reused: "inline" }));
    expect(referenceCount).toBeGreaterThan(0);
  });
});
