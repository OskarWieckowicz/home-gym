import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ProceduralGlb } from "./procedural-glb.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("ProceduralGlb", () => {
  it("writes a valid GLB with merged material groups, normals, and measured bounds", async () => {
    const directory = await mkdtemp(join(tmpdir(), "home-gym-glb-"));
    temporaryDirectories.push(directory);
    const output = join(directory, "fixture.glb");
    const model = new ProceduralGlb({
      generator: "test generator",
      materials: [
        { name: "Steel", baseColorFactor: [0.1, 0.1, 0.1, 1], metallicFactor: 0.7, roughnessFactor: 0.3 },
        { name: "Rubber", baseColorFactor: [0.01, 0.01, 0.01, 1], metallicFactor: 0, roughnessFactor: 0.9 },
      ],
    });
    model.addBox({ center: [0, 0.05, 0], size: [0.2, 0.1, 0.3] });
    model.addCylinder({ center: [0, 0.1, 0], length: 0.16, radius: 0.04, material: 1, segments: 12 });

    const metrics = await model.write(output);
    const file = await readFile(output);
    const jsonLength = file.readUInt32LE(12);
    const gltf = JSON.parse(file.subarray(20, 20 + jsonLength).toString());

    expect(file.readUInt32LE(0)).toBe(0x46546c67);
    expect(file.readUInt32LE(4)).toBe(2);
    expect(file.readUInt32LE(8)).toBe(file.length);
    expect(metrics.nodes).toBe(2);
    expect(metrics.materials).toBe(2);
    expect(metrics.min[1]).toBe(0);
    expect(gltf.asset.generator).toBe("test generator");
    expect(gltf.nodes).toHaveLength(2);
    expect(gltf.bufferViews.every((view) => view.byteOffset % 4 === 0)).toBe(true);
    expect(gltf.meshes.every((mesh) => mesh.primitives.every((primitive) => primitive.attributes.NORMAL !== undefined))).toBe(true);
    expect(gltf.meshes.every((mesh) => mesh.primitives.every((primitive) => gltf.accessors[primitive.indices].componentType === 5123))).toBe(true);
  });

  it("produces byte-identical output for the same inputs", async () => {
    const directory = await mkdtemp(join(tmpdir(), "home-gym-glb-determinism-"));
    temporaryDirectories.push(directory);
    const createFixture = async (name) => {
      const output = join(directory, name);
      const model = new ProceduralGlb({
        generator: "deterministic fixture",
        materials: [{ name: "Steel", baseColorFactor: [0.1, 0.1, 0.1, 1], metallicFactor: 0.7, roughnessFactor: 0.3 }],
      });
      model.addBox({ center: [0, 0.1, 0], size: [0.2, 0.2, 0.3] });
      model.addCylinder({ center: [0, 0.25, 0], length: 0.2, radius: 0.05, axis: "y", segments: 12 });
      await model.write(output);
      return readFile(output);
    };

    expect(await createFixture("first.glb")).toEqual(await createFixture("second.glb"));
  });
});
