import { readFile } from "node:fs/promises";
import { beforeAll, describe, expect, it } from "vitest";
import { Raycaster, Vector3 } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

let scene;
beforeAll(async () => {
  const bytes = await readFile(new URL("../public/assets/harbor-squat-stands.glb", import.meta.url));
  ({ scene } = await new GLTFLoader().parseAsync(new Uint8Array(bytes).buffer, ""));
  scene.updateMatrixWorld(true);
});

function hits(origin, direction) {
  return new Raycaster(new Vector3(...origin), new Vector3(...direction)).intersectObject(scene, true);
}

describe("Harbor stand structure", () => {
  it.each([-0.38, 0.38])("shows the outside of the back pad using normal face culling at x=%s", (x) => {
    const front = hits([x, 1.435, -1], [0, 0, 1])[0];
    expect(front.object.material.name).toBe("Black rubber");
    expect(front.point.z).toBeCloseTo(0.056, 5);
  });

  it.each([-0.38, 0.38])("has genuinely open adjustment holes and solid webs at x=%s", (x) => {
    for (const y of [0.7, 0.85, 1.1, 1.25, 1.515, 1.635]) {
      expect(hits([x, y, -1], [0, 0, 1])).toHaveLength(0);
      expect(hits([x, y + 0.022, -1], [0, 0, 1]).length).toBeGreaterThan(0);
    }
  });

  it.each([-0.38, 0.38])("has independent lined hooks, lower spotters and open H feet at x=%s", (x) => {
    const hook = hits([x, 2, 0], [0, -1, 0])[0];
    expect(hook.point.y).toBeCloseTo(1.376, 5);
    expect(hook.object.material.name).toBe("Black rubber");
    const spotter = hits([x, 2, -0.2], [0, -1, 0])[0];
    expect(spotter.point.y).toBeCloseTo(0.58, 5);
    expect(spotter.object.material.name).toBe("Black rubber");
    expect(hits([x + 0.1, 2, -0.15], [0, -1, 0])).toHaveLength(0);
    expect(hits([x + 0.1, 2, -0.37], [0, -1, 0]).length).toBeGreaterThan(0);
  });

  it("keeps the space between the two stands empty", () => {
    for (const z of [-0.37, 0, 0.13, 0.37]) expect(hits([0, 2, z], [0, -1, 0])).toHaveLength(0);
  });
});
