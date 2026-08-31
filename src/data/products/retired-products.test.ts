import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { retiredProducts } from "./retired-products";
import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";
import { decodeProject, serializeProject } from "@/features/project/serialization/project-codec";
import { findProjectProductById } from "@/features/catalog/queries/project-products";

describe("historical product categories", () => {
  it("retains every frozen specification, including its historical category", () => {
    const original = ["racks", "benches", "barbells", "plates", "dumbbells", "cardio", "accessories"]
      .flatMap((name) => JSON.parse(readFileSync(`src/data/products/retired/${name}.json`, "utf8")));
    expect(retiredProducts).toEqual(original);
    expect(Object.isFrozen(retiredProducts)).toBe(true);
    expect(retiredProducts.every((product) => Object.isFrozen(product.dimensions))).toBe(true);
  });

  it("round-trips a current project with reclassified active and historical products", () => {
    const project = {
      ...createDefaultProject(),
      projectItems: [
        { id: "project-item_kettlebell", productId: "product_forge_kettlebell_16kg" },
        { id: "project-item_wraps", productId: "product_cove_wrist_wraps" },
      ],
    };
    const saved = serializeProject(project);
    if (!saved.success) throw new Error(saved.error.message);
    const decoded = decodeProject(JSON.parse(saved.json));
    if (!decoded.success) throw new Error(decoded.error.message);
    const state = createProjectStore(decoded.project).getState();
    expect(state.project).toEqual(project);
    expect(state.validation.items.map(({ price }) => price)).toEqual([299, 89]);
    expect(findProjectProductById("product_forge_kettlebell_16kg")?.category).toBe("free-weights");
    expect(findProjectProductById("product_cove_wrist_wraps")?.category).toBe("accessories");
  });
});
