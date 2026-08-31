import { execFile } from "node:child_process";
import { copyFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";
import { generateGlbTopViewSvg } from "./lib/glb-top-view.mjs";

const execFileAsync = promisify(execFile);
const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
let temporaryDirectory;

afterEach(async () => {
  if (temporaryDirectory) await rm(temporaryDirectory, { recursive: true, force: true });
  temporaryDirectory = undefined;
});

function parseGlb(file) {
  const jsonLength = file.readUInt32LE(12);
  const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString());
  const primitives = gltf.meshes.flatMap((mesh) => mesh.primitives);
  const positions = primitives.map((primitive) => gltf.accessors[primitive.attributes.POSITION]);
  const min = [0, 1, 2].map((axis) => Math.min(...positions.map((accessor) => accessor.min[axis])));
  const max = [0, 1, 2].map((axis) => Math.max(...positions.map((accessor) => accessor.max[axis])));
  return { gltf, primitives, min, dimensions: max.map((value, axis) => value - min[axis]) };
}

async function generateTwice(scriptName, directory) {
  const first = join(directory, "first.glb"), second = join(directory, "second.glb");
  const script = join(repositoryRoot, "scripts", scriptName);
  await execFileAsync(process.execPath, [script, first], { cwd: repositoryRoot });
  await execFileAsync(process.execPath, [script, second], { cwd: repositoryRoot });
  return [await readFile(first), await readFile(second)];
}

describe("Product asset generators", () => {
  it.each([
    { slug: "harbor-squat-stands", groups: 4, minimum: [-0.54, 0, -0.41], dimensions: [1.08, 1.78, 0.82], viewBox: "-0.54 -0.41 1.08 0.82" },
    { slug: "groundwork-exercise-mat", groups: 3, minimum: [-0.325, 0, -0.9], dimensions: [0.65, 0.01, 1.8], viewBox: "-0.325 -0.9 0.65 1.8" },
    { slug: "wall-mounted-punching-bag", groups: 4, minimum: [-0.3, 0, -0.6], dimensions: [0.6, 1.9, 1.2], viewBox: "-0.3 -0.6 0.6 1.2" },
    { slug: "flex-studio-dumbbells", groups: 3, minimum: [-0.23, 0, -0.12], dimensions: [0.46, 0.18, 0.24], viewBox: "-0.23 -0.12 0.46 0.24" },
    { slug: "freestanding-dip-bars", groups: 4, minimum: [-0.6, 0, -0.4], dimensions: [1.2, 1.1, 0.8], viewBox: "-0.6 -0.4 1.2 0.8" },
    { slug: "loop-cable-trainer", groups: 5, minimum: [-0.31, 0, -0.14], dimensions: [0.62, 2.05, 0.28], viewBox: "-0.31 -0.14 0.62 0.28" },
    { slug: "compact-dual-pulley-station", groups: 5, minimum: [-0.8, 0, -0.5], dimensions: [1.6, 2.2, 1], viewBox: "-0.8 -0.5 1.6 1" },
    { slug: "northstar-half-rack", groups: 4, minimum: [-0.61, 0, -0.65], dimensions: [1.22, 2.15, 1.3], viewBox: "-0.61 -0.65 1.22 1.3" },
    { slug: "pivot-flat-bench", groups: 5, minimum: [-0.29, 0, -0.62], dimensions: [0.58, 0.44, 1.24], viewBox: "-0.29 -0.62 0.58 1.24" },
    { slug: "range-adjustable-dumbbells", groups: 5, minimum: [-0.24, 0, -0.27], dimensions: [0.48, 0.62, 0.54], viewBox: "-0.24 -0.27 0.48 0.54" },
    { slug: "surge-compact-treadmill", groups: 7, minimum: [-0.39, 0, -0.81], dimensions: [0.78, 1.38, 1.62], viewBox: "-0.39 -0.81 0.78 1.62" },
  ])("ships a reproducible $slug model and top view within production budgets", async ({ slug, groups, minimum, dimensions, viewBox }) => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), `home-gym-${slug}-`));
    const [first, second] = await generateTwice(`generate-${slug}-glb.mjs`, temporaryDirectory);
    const parsed = parseGlb(first);
    const assetDirectory = join(repositoryRoot, "public/assets");

    expect(first).toEqual(second);
    expect(first).toEqual(await readFile(join(assetDirectory, `${slug}.glb`)));
    expect(first.byteLength).toBeLessThanOrEqual(1_000_000);
    const triangles = parsed.primitives.reduce((sum, primitive) => sum + parsed.gltf.accessors[primitive.indices].count / 3, 0);
    expect(triangles).toBeLessThanOrEqual(18_000);
    expect(parsed.gltf.nodes).toHaveLength(groups);
    expect(parsed.gltf.materials).toHaveLength(groups);
    expect(parsed.primitives).toHaveLength(groups);
    expect(parsed.primitives.every((primitive) => primitive.attributes.NORMAL !== undefined)).toBe(true);
    minimum.forEach((value, axis) => expect(parsed.min[axis]).toBeCloseTo(value, 6));
    dimensions.forEach((value, axis) => expect(parsed.dimensions[axis]).toBeCloseTo(value, 6));

    const output = join(temporaryDirectory, "top.svg");
    const namedSource = join(temporaryDirectory, `${slug}.glb`);
    await copyFile(join(temporaryDirectory, "first.glb"), namedSource);
    await generateGlbTopViewSvg(namedSource, output);
    const svg = await readFile(output, "utf8");
    expect(svg).toBe(await readFile(join(assetDirectory, `${slug}-top.svg`), "utf8"));
    expect(svg).toContain(`viewBox="${viewBox}"`);
    expect(svg).toContain("<path");
    expect(svg).not.toContain("<script");
    expect(svg).not.toContain("<image");
  });

  it("keeps Pivot upholstery flat at the catalog height", async () => {
    const { gltf } = parseGlb(await readFile(join(repositoryRoot, "public/assets/pivot-flat-bench.glb")));
    const padMesh = gltf.meshes.find((mesh) => mesh.name === "Charcoal flat pad");
    expect(padMesh.primitives).toHaveLength(1);
    const pad = gltf.accessors[padMesh.primitives[0].attributes.POSITION];
    [-0.155, 0.37, -0.55].forEach((value, axis) => expect(pad.min[axis]).toBeCloseTo(value, 6));
    [0.155, 0.44, 0.55].forEach((value, axis) => expect(pad.max[axis]).toBeCloseTo(value, 6));
  });

  it.each([
    ["generate-quarry-power-bar-glb.mjs", 4, [2.2, 0.054, 0.054]],
    ["generate-foundry-bumper-plates-glb.mjs", 3, [0.45, 0.45, 0.364]],
    ["generate-anchor-pullup-bar-glb.mjs", 4, [1.12, 0.38, 0.54]],
    ["generate-cairn-iron-plates-glb.mjs", 3, [0.45, 0.45, 0.24]],
    ["generate-delta-change-plates-glb.mjs", 5, [0.32, 0.32, 0.18]],
  ])("generates deterministic merged geometry for %s", async (scriptName, nodes, expectedDimensions) => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "home-gym-strength-assets-"));
    const [first, second] = await generateTwice(scriptName, temporaryDirectory);
    const parsed = parseGlb(first);

    expect(first).toEqual(second);
    expect(parsed.gltf.nodes).toHaveLength(nodes);
    expect(parsed.primitives).toHaveLength(nodes);
    expect(parsed.primitives.every((primitive) => primitive.attributes.NORMAL !== undefined)).toBe(true);
    expect(parsed.min[1]).toBeCloseTo(0, 6);
    expectedDimensions.forEach((dimension, axis) => expect(parsed.dimensions[axis]).toBeCloseTo(dimension, 5));
  });

  it("generates the deterministic Current Fold Bike inside its exact canonical envelope", async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "home-gym-current-fold-bike-"));
    const [first, second] = await generateTwice("generate-current-fold-bike-glb.mjs", temporaryDirectory);
    const parsed = parseGlb(first);

    expect(first).toEqual(second);
    expect(first.byteLength).toBeLessThanOrEqual(1_000_000);
    expect(parsed.gltf.nodes).toHaveLength(7);
    expect(parsed.primitives).toHaveLength(7);
    expect(parsed.gltf.materials).toHaveLength(7);
    expect(parsed.primitives.every((primitive) => primitive.attributes.NORMAL !== undefined)).toBe(true);
    [-0.265, 0, -0.49].forEach((value, axis) => expect(parsed.min[axis]).toBeCloseTo(value, 6));
    [0.53, 1.18, 0.98].forEach((dimension, axis) => expect(parsed.dimensions[axis]).toBeCloseTo(dimension, 6));
  });

  it("generates a deterministic render-only strength-station composition", async () => {
    temporaryDirectory = await mkdtemp(join(tmpdir(), "home-gym-strength-composition-"));
    const [first, second] = await generateTwice("generate-strength-station-composition-glb.mjs", temporaryDirectory);
    const parsed = parseGlb(first);

    expect(first).toEqual(second);
    expect(first.byteLength).toBeLessThanOrEqual(1_000_000);
    expect(parsed.gltf.asset.generator).toContain("render-only strength station composition");
    expect(parsed.gltf.nodes).toHaveLength(8);
    expect(parsed.primitives).toHaveLength(8);
    expect(parsed.gltf.materials).toHaveLength(8);
    expect(parsed.primitives.every((primitive) => primitive.attributes.NORMAL !== undefined)).toBe(true);
    expect(parsed.min[1]).toBeCloseTo(0, 6);
    [2.275, 2.27, 1.74].forEach((dimension, axis) => expect(parsed.dimensions[axis]).toBeCloseTo(dimension, 5));
  });
});
