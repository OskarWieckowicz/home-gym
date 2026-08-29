import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ProceduralGlb } from "./procedural-glb.mjs";
import { generateGlbTopViewSvg } from "./glb-top-view.mjs";

let temporaryDirectory;

afterEach(async () => {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

describe("GLB top-view projection", () => {
  it("writes a deterministic transparent SVG using GLB material colors", async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "home-gym-top-view-"));
    const glb = join(temporaryDirectory, "fixture.glb"), first = join(temporaryDirectory, "first.svg"), second = join(temporaryDirectory, "second.svg");
    const model = new ProceduralGlb({
      generator: "top-view fixture",
      materials: [{ name: "Orange", baseColorFactor: [0.9, 0.2, 0.04, 1], metallicFactor: 0.1, roughnessFactor: 0.5 }],
    });
    model.addBox({ center: [0, 0.1, 0], size: [0.4, 0.2, 0.6] });
    await model.write(glb);

    await generateGlbTopViewSvg(glb, first);
    await generateGlbTopViewSvg(glb, second);
    const firstSvg = await readFile(first, "utf8"), secondSvg = await readFile(second, "utf8");

    expect(firstSvg).toBe(secondSvg);
    expect(firstSvg).toContain('viewBox="-0.2 -0.3 0.4 0.6"');
    expect(firstSvg).toContain("#e6330a");
    expect(firstSvg).not.toContain("<script");
    expect(firstSvg).not.toContain("<rect");
  });
});
