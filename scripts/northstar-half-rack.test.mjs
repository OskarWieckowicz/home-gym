import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Box3, Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let rack;
beforeAll(async () => {
  const bytes = await readFile(new URL("../public/assets/northstar-half-rack.glb", import.meta.url));
  const loaded = await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer, "");
  rack = loaded.scene;
  rack.updateMatrixWorld(true);
});

function intersections(origin, direction) {
  const ray = new Raycaster(new Vector3(...origin), new Vector3(...direction));
  return ray.intersectObject(rack, true);
}

describe("Northstar detailed half-rack structure", () => {
  it("confines orange to narrow spotter-tip and J-cup edges, keeping large attachments graphite", () => {
    const accents = [];
    rack.traverse((object) => {
      if (object.isMesh && object.material.name === "Muted burnt-orange accent") accents.push(object);
    });
    expect(accents).toHaveLength(1);
    const accent = accents[0];
    const bounds = new Box3().setFromObject(accent);
    expect(bounds.min.y).toBeCloseTo(0.829, 5);
    expect(bounds.max.y).toBeCloseTo(1.474, 5);
    expect(bounds.min.z).toBeCloseTo(-0.547, 5);
    expect(bounds.max.z).toBeCloseTo(-0.025, 5);
    const positions = accent.geometry.attributes.position;
    let cupVertices = 0, spotterVertices = 0;
    for (let index = 0; index < positions.count; index++) {
      const x = Math.abs(positions.getX(index));
      const y = positions.getY(index), z = positions.getZ(index);
      const onCupEdge = x >= 0.5614 && x <= 0.5636
        && y >= 1.3999 && y <= 1.4741 && z >= -0.0411 && z <= -0.0249;
      const onSpotterEdge = x >= 0.5589 && x <= 0.5611
        && y >= 0.8289 && y <= 0.9591 && z >= -0.5471 && z <= -0.5269;
      expect(onCupEdge || onSpotterEdge).toBe(true);
      if (onCupEdge) cupVertices++;
      if (onSpotterEdge) spotterVertices++;
    }
    expect(cupVertices).toBeGreaterThan(0);
    expect(spotterVertices).toBeGreaterThan(0);
    for (const x of [-0.515, 0.515]) {
      for (const [y, z] of [[2.02, -1], [1.4, -1], [0.85, -0.4]]) {
        expect(intersections([x, y, z], [0, 0, 1])[0].object.material.name)
          .toBe("Graphite powder coat");
      }
    }
  });

  it.each([-0.515, 0.515])("shows the outside of the back pad using normal face culling at x=%s", (x) => {
    const front = intersections([x, 1.5, -1], [0, 0, 1])[0];
    expect(front.object.material.name).toBe("Black UHMW and rubber");
    expect(front.point.z).toBeCloseTo(0.144, 5);
  });

  it.each([-0.515, 0.515])("has open front/rear adjustment holes with solid webs at x=%s", (x) => {
    for (const y of [1.1, 1.25, 1.7, 1.85]) {
      expect(intersections([x, y, -1], [0, 0, 1])).toHaveLength(0);
      expect(intersections([x, y + 0.025, -1], [0, 0, 1]).length).toBeGreaterThan(0);
    }
  });

  it("also perforates both side walls of each upright", () => {
    for (const y of [1.1, 1.25, 1.7, 1.85]) {
      expect(intersections([-1, y, 0.22], [1, 0, 0])).toHaveLength(0);
      expect(intersections([-1, y + 0.025, 0.22], [1, 0, 0]).length).toBeGreaterThan(0);
    }
  });

  it.each([-0.515, 0.515])("keeps separate lined J-cups and long forward safety arms at x=%s", (x) => {
    const hook = intersections([x, 1.8, 0.05], [0, -1, 0])[0];
    expect(hook.point.y).toBeCloseTo(1.396, 5);
    expect(hook.object.material.name).toBe("Black UHMW and rubber");
    for (const z of [-0.15, -0.4]) {
      const arm = intersections([x, 1.8, z], [0, -1, 0])[0];
      expect(arm.point.y).toBeCloseTo(0.9005, 5);
      expect(arm.object.material.name).toBe("Black UHMW and rubber");
    }
    const tip = intersections([x, 1.8, -0.537], [0, -1, 0])[0];
    expect(tip.point.y).toBeCloseTo(0.964, 5);
  });

  it("retains an open training area, rear base tie and supported pull-up bar", () => {
    for (const z of [-0.5, -0.2, 0.4]) {
      expect(intersections([0, 2.4, z], [0, -1, 0])).toHaveLength(0);
    }
    expect(intersections([0, 1, 0.54], [0, -1, 0])[0].point.y).toBeCloseTo(0.16, 5);
    const bar = intersections([0, 2.4, 0.065], [0, -1, 0])[0];
    expect(bar.point.y).toBeCloseTo(2.097, 5);
    expect(bar.object.material.name).toBe("Zinc hardware");
    for (const x of [-0.35, 0.35]) {
      expect(intersections([x, 2.4, 0.065], [0, -1, 0])[0].object.material.name).toBe("Black UHMW and rubber");
    }
  });
});
