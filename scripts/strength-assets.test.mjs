import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

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

describe("Tier 0 asset generators", () => {
  it.each([
    ["generate-quarry-power-bar-glb.mjs", 4, [2.2, 0.054, 0.054]],
    ["generate-foundry-bumper-plates-glb.mjs", 3, [0.45, 0.45, 0.364]],
    ["generate-harbor-squat-stands-glb.mjs", 4, [1.08, 1.78, 0.82]],
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
