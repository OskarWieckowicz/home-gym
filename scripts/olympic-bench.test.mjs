import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { Box3, Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { beforeAll, describe, expect, it } from "vitest";
import { generateGlbTopViewSvg } from "./lib/glb-top-view.mjs";

const asset = "public/assets/olympic-bench.glb";
let scene, binary;
beforeAll(async () => {
  binary = await readFile(asset);
  scene = (await new GLTFLoader().parseAsync(new Uint8Array(binary).buffer, "")).scene;
  scene.updateMatrixWorld(true);
});
function hits(origin, direction, name) {
  return new Raycaster(new Vector3(...origin), new Vector3(...direction))
    .intersectObject(scene, true).filter(({ object }) => !name || object.material.name === name);
}

describe("Olympic bench production asset", () => {
  it("regenerates the shipped GLB and its transparent top view exactly", async () => {
    const scratch = await mkdtemp(join(tmpdir(), "home-gym-olympic-"));
    try {
      const glb = join(scratch, "olympic-bench.glb"), svg = join(scratch, "top.svg");
      await promisify(execFile)(process.execPath, ["scripts/generate-olympic-bench-glb.mjs", glb]);
      expect(await readFile(glb)).toEqual(binary);
      await generateGlbTopViewSvg(glb, svg);
      const generated = await readFile(svg, "utf8");
      expect(generated).toBe(await readFile("public/assets/olympic-bench-top.svg", "utf8"));
      expect(generated).toContain('viewBox="-1.1 -0.8 2.2 1.6"');
      expect(generated).toContain("<path");
      expect(generated).not.toMatch(/<image|<script|<rect/);
    } finally {
      await rm(scratch, { recursive: true, force: true });
    }
  });

  it("fits the centred planning envelope at unit scale within asset budgets", () => {
    const bounds = new Box3().setFromObject(scene);
    bounds.min.toArray().forEach((value, index) => expect(value).toBeCloseTo([-1.1, 0, -0.8][index], 6));
    bounds.max.toArray().forEach((value, index) => expect(value).toBeCloseTo([1.1, 1.4, 0.8][index], 6));
    expect(binary.byteLength).toBeLessThan(1_000_000);
    expect(scene.children).toHaveLength(8);
    expect(scene.children.reduce((sum, mesh) => sum + mesh.geometry.index.count / 3, 0)).toBeLessThan(12_000);
  });

  it("has a continuous horizontal pad at 45 cm and two hollow perforated rear uprights", () => {
    for (const z of [-0.6, -0.3, 0, 0.3, 0.5]) {
      const pad = hits([0, 0.7, z], [0, -1, 0])[0];
      expect(pad.object.material.name).toBe("Continuous black flat pad");
      expect(pad.point.y).toBeCloseTo(0.45, 6);
    }
    for (const x of [-0.57, 0.57]) {
      expect(hits([x, 1.26, 0], [0, 0, 1])).toHaveLength(0);
      expect(hits([x + 0.024, 1.26, 0], [0, 0, 1])[0].point.z).toBeCloseTo(0.51, 6);
    }
    expect(hits([0, 1.3, 0], [0, 0, 1])).toHaveLength(0);
  });

  it("rests the loaded shaft on both liners and keeps four separate black discs", () => {
    for (const x of [-0.57, 0.57]) {
      const shaft = hits([x, 1.08, 0.45], [0, 1, 0], "Silver bar shaft")[0];
      const liner = hits([x, 1.095, 0.45], [0, -1, 0], "Black plates feet and liners")[0];
      expect(shaft.point.y).toBeCloseTo(1.086, 6);
      expect(liner.point.y).toBeCloseTo(shaft.point.y, 6);
    }
    for (const side of [-1, 1]) {
      for (const x of [0.7675, 0.8365]) {
        const plate = hits([side * x, 1.1, 0], [0, 0, 1], "Black plates feet and liners")[0];
        expect(plate.point.z).toBeCloseTo(0.225, 6);
      }
      expect(hits([side * 0.802, 1.2, 0], [0, 0, 1])).toHaveLength(0);
    }
  });

  it("uses outward-wound nondegenerate geometry under normal front-face culling", () => {
    const v = [new Vector3(), new Vector3(), new Vector3()];
    const n = [new Vector3(), new Vector3(), new Vector3()];
    let inverted = 0, degenerate = 0;
    for (const { geometry, material } of scene.children) {
      expect(material.side).toBe(0);
      for (let triangle = 0; triangle < geometry.index.count; triangle += 3) {
        for (let corner = 0; corner < 3; corner++) {
          const index = geometry.index.getX(triangle + corner);
          v[corner].fromBufferAttribute(geometry.attributes.position, index);
          n[corner].fromBufferAttribute(geometry.attributes.normal, index);
        }
        const area = v[1].sub(v[0]).cross(v[2].sub(v[0]));
        if (area.lengthSq() < 1e-20) degenerate++;
        if (area.dot(n[0].add(n[1]).add(n[2])) < -1e-10) inverted++;
      }
    }
    expect({ inverted, degenerate }).toEqual({ inverted: 0, degenerate: 0 });
  });
});
