import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let station;
beforeAll(async () => {
  const bytes = await readFile("public/assets/strength-station-composition.glb");
  station = (await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer, "")).scene;
  station.updateMatrixWorld(true);
});
function trace(origin, direction, material) {
  const hits = new Raycaster(new Vector3(...origin), new Vector3(...direction)).intersectObject(station, true);
  return material ? hits.filter((hit) => hit.object.material.name === material) : hits;
}

describe("Detailed loaded Summit station", () => {
  it("rests the 28 mm shaft on both J-cup liners without hovering", () => {
    for (const x of [-0.535, 0.535]) {
      const underside = trace([x, 1.455, -0.59], [0, 1, 0], "Dark chrome shaft");
      // Starting within the shaft misses the entry face: explicitly probe from below it.
      expect(underside).toHaveLength(0);
      const bar = trace([x, 1.44, -0.59], [0, 1, 0], "Dark chrome shaft")[0];
      const liner = trace([x, 1.46, -0.59], [0, -1, 0], "Black rubber and UHMW")[0];
      expect(bar.point.y).toBeCloseTo(1.453, 6);
      expect(liner.point.y).toBeCloseTo(bar.point.y, 6);
    }
  });

  it("keeps the bar shoulders and locking collars tight against both loaded pairs", () => {
    for (const side of [-1, 1]) {
      const outerPlate = trace([side * 1.2, 1.567, -0.59], [-side, 0, 0], "Black rubber and UHMW")[0];
      expect(Math.abs(outerPlate.point.x)).toBeCloseTo(0.83, 6);
      const collar = trace([side * 0.849, 1.6, -0.59], [0, -1, 0], "Graphite powder coat")[0];
      expect(collar.point.y).toBeCloseTo(1.505, 6);
      const lever = trace([side * 0.849, 1.6, -0.59], [0, -1, 0])[0];
      expect(lever.object.material.name).toBe("Safety orange");
      expect(lever.point.y).toBeCloseTo(1.5215, 6);
    }
  });

  it("has open spare-plate bores, annular metal hubs and beveled rubber rims", () => {
    expect(trace([0.95, 0.225, -1], [0, 0, 1])).toHaveLength(0);
    const hub = trace([0.99, 0.225, -1], [0, 0, 1])[0];
    expect(hub.object.material.name).toBe("Brushed steel");
    expect(hub.point.z).toBeCloseTo(0.17, 6);
    const face = trace([1.1, 0.225, -1], [0, 0, 1])[0];
    expect(face.object.material.name).toBe("Safety orange");
    expect(face.point.z).toBeCloseTo(0.17, 6);
    const bevel = trace([1.17, 0.225, -1], [0, 0, 1])[0];
    expect(bevel.point.z).toBeGreaterThan(face.point.z + 0.005);
  });

  it("connects the bench back support between a ladder rung and the backrest underside", () => {
    const hinge = trace([-0.5, 0.43, 0.045], [1, 0, 0], "Zinc hardware")[0];
    expect(hinge.point.x).toBeCloseTo(-0.221, 5);
    const incline = 35 * Math.PI / 180;
    const upperY = 0.43 + Math.sin(incline) * 0.42 - Math.cos(incline) * 0.06;
    const upperZ = 0.045 - Math.cos(incline) * 0.42 - Math.sin(incline) * 0.06;
    const middle = trace([-0.4, (0.211 + upperY) / 2, (-0.459 + upperZ) / 2], [1, 0, 0])[0];
    expect(middle.object.material.name).toBe("Graphite powder coat");
    expect(middle.point.x).toBeCloseTo(-0.0275, 6);
    const support = trace([-0.4, upperY, upperZ], [1, 0, 0], "Zinc hardware")[0];
    expect(support.point.x).toBeCloseTo(-0.16, 6);
  });

  it("renders every component with outward-facing nondegenerate triangles", () => {
    const a = new Vector3(), ab = new Vector3(), ac = new Vector3(), average = new Vector3(), scratch = new Vector3();
    let inverted = 0, degenerate = 0;
    for (const mesh of station.children) {
      const { position, normal } = mesh.geometry.attributes;
      const indices = mesh.geometry.index;
      for (let offset = 0; offset < indices.count; offset += 3) {
        const ia = indices.getX(offset), ib = indices.getX(offset + 1), ic = indices.getX(offset + 2);
        a.fromBufferAttribute(position, ia);
        ab.fromBufferAttribute(position, ib).sub(a);
        ac.fromBufferAttribute(position, ic).sub(a);
        ab.cross(ac);
        average.fromBufferAttribute(normal, ia).add(scratch.fromBufferAttribute(normal, ib)).add(scratch.fromBufferAttribute(normal, ic));
        if (ab.lengthSq() < 1e-20) degenerate++;
        if (ab.dot(average) < -1e-10) inverted++;
      }
    }
    expect({ inverted, degenerate }).toEqual({ inverted: 0, degenerate: 0 });
  });
});
