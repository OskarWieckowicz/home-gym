import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { Box3, Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { generateGlbTopViewSvg } from "./lib/glb-top-view.mjs";

let rack;
beforeAll(async () => {
  const file = await readFile("public/assets/squat-rack.glb");
  rack = (await new GLTFLoader().parseAsync(new Uint8Array(file).buffer, "")).scene;
  rack.updateMatrixWorld(true);
});
const cast = (origin, direction) => new Raycaster(new Vector3(...origin), new Vector3(...direction)).intersectObject(rack, true);

describe("Summit detailed cage", () => {
  it("preserves the accepted envelope and five material slots used by the complete station", () => {
    const bounds = new Box3().setFromObject(rack);
    [-0.66, 0, -0.87].forEach((value, axis) => expect(bounds.min.getComponent(axis)).toBeCloseTo(value, 6));
    [0.66, 2.27, 0.87].forEach((value, axis) => expect(bounds.max.getComponent(axis)).toBeCloseTo(value, 6));
    expect(rack.children.map((mesh) => mesh.material.name)).toEqual([
      "Graphite powder coat", "Safety orange powder coat", "Black UHMW and rubber", "Zinc hardware", "Brushed steel",
    ]);
  });

  it("has hollow, perforated walls on all four columns with solid steel between holes", () => {
    for (const row of [3, 8, 18, 21]) {
      const y = 0.38 + row * 0.073;
      for (const x of [-0.535, 0.535]) {
        expect(cast([x, y, -1], [0, 0, 1])).toHaveLength(0);
        expect(cast([x, y + 0.025, -1], [0, 0, 1])).toHaveLength(4);
      }
      for (const z of [-0.48, 0.48]) {
        expect(cast([-1, y, z], [1, 0, 0])).toHaveLength(0);
        expect(cast([-1, y + 0.025, z], [1, 0, 0])).toHaveLength(4);
      }
    }
  });

  it("supports the unchanged station bar height on rubber-lined cradles", () => {
    for (const x of [-0.535, 0.535]) {
      const cradle = cast([x, 1.7, -0.59], [0, -1, 0])[0];
      expect(cradle.point.y).toBeCloseTo(1.453, 6);
      expect(cradle.object.material.name).toBe("Black UHMW and rubber");
      const back = cast([x, 1.54, -1], [0, 0, 1])[0];
      expect(back.object.material.name).toBe("Black UHMW and rubber");
      const safety = cast([x, 1.4, 0], [0, -1, 0])[0];
      expect(safety.point.y).toBeCloseTo(1.136, 5);
      expect(safety.object.material.name).toBe("Safety orange powder coat");
    }
  });

  it("keeps an open entrance, connected upper rails and a rear floor tie", () => {
    expect(cast([0, 0.3, -0.48], [0, -1, 0])).toHaveLength(0);
    expect(cast([0, 2, 0], [0, -1, 0])).toHaveLength(0);
    expect(cast([0, 0.3, 0.48], [0, -1, 0])[0].point.y).toBeCloseTo(0.125, 6);
    for (const x of [-0.535, 0.535]) {
      expect(cast([x, 2.5, 0], [0, -1, 0])[0].point.y).toBeCloseTo(2.215, 6);
    }
    expect(cast([0, 2.5, -0.56], [0, -1, 0])[0].object.material.name).toBe("Brushed steel");
  });

  it("uses outward triangle winding for normal single-sided rendering", () => {
    const a = new Vector3(), b = new Vector3(), c = new Vector3(), n = new Vector3();
    for (const mesh of rack.children) {
      const { position, normal } = mesh.geometry.attributes;
      const index = mesh.geometry.index;
      for (let i = 0; i < index.count; i += 3) {
        const [ia, ib, ic] = [index.getX(i), index.getX(i + 1), index.getX(i + 2)];
        a.fromBufferAttribute(position, ia);
        b.fromBufferAttribute(position, ib).sub(a);
        c.fromBufferAttribute(position, ic).sub(a);
        n.fromBufferAttribute(normal, ia);
        expect(b.cross(c).dot(n)).toBeGreaterThanOrEqual(-1e-8);
      }
    }
  });

  it.each([
    ["squat-rack", "generate-squat-rack-glb.mjs", 22_000],
    ["strength-station-composition", "generate-strength-station-composition-glb.mjs", 27_000],
  ])("ships reproducible %s geometry and its matching top view within budget", async (slug, generator, triangleBudget) => {
    const temporary = await mkdtemp(join(tmpdir(), "summit-detail-"));
    try {
      const output = join(temporary, `${slug}.glb`);
      const svg = join(temporary, "top.svg");
      execFileSync(process.execPath, [`scripts/${generator}`, output]);
      const generated = await readFile(output);
      expect(generated).toEqual(await readFile(`public/assets/${slug}.glb`));
      expect(generated.byteLength).toBeLessThanOrEqual(1_000_000);
      const gltf = JSON.parse(generated.subarray(20, 20 + generated.readUInt32LE(12)).toString());
      const triangles = gltf.meshes.flatMap((mesh) => mesh.primitives)
        .reduce((sum, primitive) => sum + gltf.accessors[primitive.indices].count / 3, 0);
      expect(triangles).toBeLessThanOrEqual(triangleBudget);
      await generateGlbTopViewSvg(output, svg);
      expect(await readFile(svg, "utf8")).toBe(await readFile(`public/assets/${slug}-top.svg`, "utf8"));
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  });
});
