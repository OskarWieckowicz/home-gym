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
  it.each(["box", "chamfer", "x", "y", "z"])("repairs %s winding without changing positions, normals or bounds", (kind) => {
    const model = new ProceduralGlb({ generator: "winding fixture", materials: [{ name: "Steel" }] });
    const options = { center: [0.2, 0.4, -0.1], rotation: [0.4, 0.2, 0.6], size: [0.4, 0.2, 0.3], bevel: 0.02 };
    if (kind === "box") model.addBox(options);
    else if (kind === "chamfer") model.addChamferedBox(options);
    else model.addCylinder({ ...options, axis: kind, length: 0.3, radius: 0.08 });
    const before = structuredClone(model.groups[0]);
    const metrics = model.getMetrics();
    const corrected = model.orientFacesToNormals();
    expect(corrected).toBe(kind === "box" ? 0 : kind === "chamfer" ? 16 : 40);
    expect(model.groups[0].vertices).toEqual(before.vertices);
    expect(model.groups[0].normals).toEqual(before.normals);
    expect(model.getMetrics()).toEqual(metrics);
    expect(model.orientFacesToNormals()).toBe(0);
    const { vertices, normals, indices } = model.groups[0];
    for (let i = 0; i < indices.length; i += 3) {
      const [a, b, c] = indices.slice(i, i + 3).map((j) => j * 3);
      const u = [0, 1, 2].map((j) => vertices[b + j] - vertices[a + j]);
      const v = [0, 1, 2].map((j) => vertices[c + j] - vertices[a + j]);
      const cross = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
      expect(cross.reduce((dot, value, j) => dot + value * normals[a + j], 0)).toBeGreaterThan(0);
    }
  });

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
