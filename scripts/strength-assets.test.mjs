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

describe("Tier 0 strength asset generators", () => {
  it.each([
    ["generate-quarry-power-bar-glb.mjs", 4, [2.2, 0.054, 0.054]],
    ["generate-foundry-bumper-plates-glb.mjs", 3, [0.45, 0.45, 0.364]],
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
});
