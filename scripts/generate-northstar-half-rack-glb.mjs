import { ExtrudeGeometry, Path, Shape, TorusGeometry } from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/northstar-half-rack.glb";
const MATERIAL = { frame: 0, accent: 1, rubber: 2, hardware: 3 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Northstar Half Rack generator v4; detailed catalog-guided open half rack",
  materials: [
    { name: "Graphite powder coat", baseColorFactor: [0.038, 0.047, 0.06, 1], metallicFactor: 0.7, roughnessFactor: 0.38 },
    { name: "Muted burnt-orange accent", baseColorFactor: [0.48, 0.12, 0.025, 1], metallicFactor: 0.35, roughnessFactor: 0.48 },
    { name: "Black UHMW and rubber", baseColorFactor: [0.006, 0.007, 0.009, 1], metallicFactor: 0.02, roughnessFactor: 0.78 },
    { name: "Zinc hardware", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.93, roughnessFactor: 0.2 },
  ],
});
const box = (center, size, material = MATERIAL.frame) => model.addChamferedBox({
  center, size, material, bevel: Math.min(0.003, size[0] / 4, size[2] / 4),
});
const pin = (center, length, radius, axis, material = MATERIAL.hardware, segments = 12) => {
  model.addCylinder({ center, length, radius, axis, material, segments });
};
function brace(x, fromY, fromZ, toY, toZ, width, depth, material = MATERIAL.frame) {
  model.addBox({
    center: [x, (fromY + toY) / 2, (fromZ + toZ) / 2],
    size: [width, Math.hypot(toY - fromY, toZ - fromZ), depth],
    rotation: [Math.atan2(toZ - fromZ, toY - fromY), 0, 0],
    material,
  });
}

// Weld identical vertices only when their normals match, preserving machined edges.
function meshPart(source, { center, rotation = [0, 0, 0], material = MATERIAL.frame }) {
  source.deleteAttribute("uv");
  const geometry = mergeVertices(source, 0.000001);
  model.addGeometry({
    center, rotation, material,
    vertices: [...geometry.attributes.position.array],
    normals: [...geometry.attributes.normal.array],
    indices: [...geometry.index.array],
  });
  source.dispose();
  geometry.dispose();
}

function plate(points, { depth = 0.006, holes = [], ...placement }) {
  const shape = new Shape();
  for (const [i, point] of points.entries()) {
    if (i === 0) shape.moveTo(...point);
    else shape.lineTo(...point);
  }
  shape.closePath();
  for (const [x, y, radius] of holes) {
    const hole = new Path();
    hole.absarc(x, y, radius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  meshPart(new ExtrudeGeometry(shape, { depth, curveSegments: 6, bevelEnabled: false }), placement);
}

function bolt(center, axis) {
  pin(center, 0.003, 0.012, axis);
  pin(center, 0.011, 0.008, axis, MATERIAL.hardware, 6);
}

function latch(x, y, side) {
  pin([x, y, postZ], 0.125, 0.007, "x");
  pin([x + side * 0.066, y, postZ], 0.015, 0.013, "x");
  meshPart(new TorusGeometry(0.02, 0.002, 6, 20), {
    center: [x + side * 0.075, y - 0.02, postZ],
    rotation: [0, Math.PI / 2, 0], material: MATERIAL.hardware,
  });
}

function perforatedPost(x) {
  const holes = Array.from({ length: 23 }, (_, row) => [0, 0.35 + row * 0.075, 0.009]);
  for (const side of [-1, 1]) {
    plate([[-0.0375, 0.105], [0.0375, 0.105], [0.0375, 2.14], [-0.0375, 2.14]], {
      depth: 0.003, holes, center: [x, 0, postZ + (side < 0 ? -0.0375 : 0.0345)],
    });
    plate([[-0.0345, 0.105], [0.0345, 0.105], [0.0345, 2.14], [-0.0345, 2.14]], {
      depth: 0.003, holes, center: [x + (side < 0 ? -0.0375 : 0.0345), 0, postZ], rotation: [0, Math.PI / 2, 0],
    });
  }
  box([x, 2.145, postZ], [0.075, 0.01, 0.075], MATERIAL.rubber);
}

function cup(x, side) {
  // Wraparound bracket and bent plate cradle are distinct from the post itself.
  box([x, 1.46, 0.176], [0.095, 0.2, 0.012], MATERIAL.frame);
  for (const edge of [-1, 1]) box([x + edge * 0.044, 1.46, postZ], [0.012, 0.2, 0.084], MATERIAL.frame);
  plate([[0.17, 1.367], [-0.018, 1.367], [-0.041, 1.393], [-0.041, 1.478],
    [-0.025, 1.478], [-0.025, 1.4], [-0.012, 1.386], [0.154, 1.386], [0.154, 1.543], [0.17, 1.543]], {
    depth: 0.093, center: [x + 0.0465, 0, 0], rotation: [0, -Math.PI / 2, 0], material: MATERIAL.frame,
  });
  box([x, 1.391, 0.069], [0.081, 0.01, 0.159], MATERIAL.rubber);
  box([x, 1.467, 0.149], [0.081, 0.137, 0.01], MATERIAL.rubber);
  box([x, 1.446, -0.022], [0.081, 0.063, 0.008], MATERIAL.rubber);
  // Match the tiny additional edge accents on the catalog J-cups.
  box([x + side * 0.0475, 1.437, -0.033], [0.002, 0.074, 0.016], MATERIAL.accent);
  latch(x, 1.475, side);
}

function spotter(x, side) {
  box([x, 0.89, 0.173], [0.104, 0.27, 0.018], MATERIAL.frame);
  for (const edge of [-1, 1]) box([x + edge * 0.046, 0.89, postZ], [0.014, 0.27, 0.09], MATERIAL.frame);
  box([x, 0.85, -0.185], [0.08, 0.075, 0.71], MATERIAL.frame);
  box([x, 0.894, -0.185], [0.07, 0.013, 0.67], MATERIAL.rubber);
  box([x, 0.894, -0.537], [0.088, 0.14, 0.023], MATERIAL.frame);
  // A narrow orange edge on each outer tip matches the accepted catalog photo.
  box([x + side * 0.045, 0.894, -0.537], [0.002, 0.13, 0.02], MATERIAL.accent);
  box([x, 0.923, -0.523], [0.074, 0.074, 0.007], MATERIAL.rubber);
  // Twin under-arm gussets leave a visible fabricated seam beneath the beam.
  for (const edge of [-1, 1]) plate([[0.162, 0.774], [-0.13, 0.8125], [0.162, 0.8125]], {
    center: [x + edge * 0.029 + 0.003, 0, 0], rotation: [0, -Math.PI / 2, 0], material: MATERIAL.frame,
  });
  for (const y of [0.775, 1.004]) bolt([x, y, 0.161], "z");
  // Recessed-looking fastener heads in the protective strip, not floating screws.
  for (const z of [-0.46, 0.075]) pin([x, 0.9005, z], 0.001, 0.0045, "y");
  latch(x, 0.875, side);
}

// Metres; exact 1.22 × 1.30 m floor envelope, 2.15 m high, front at negative Z.
// Only two tall uprights: the open front and cantilever arms distinguish this from the cage.
const postX = 0.515, postZ = 0.22;
for (const side of [-1, 1]) {
  const x = side * postX;
  box([x, 0.065, 0], [0.08, 0.09, 1.276]);
  for (const z of [-0.644, 0.644]) box([x, 0.065, z], [0.081, 0.091, 0.012], MATERIAL.rubber);
  for (const z of [-0.56, 0.56]) {
    model.addChamferedBox({ center: [x, 0.015, z], size: [0.19, 0.03, 0.18], bevel: 0.012, material: MATERIAL.rubber });
    box([x, 0.037, z], [0.18, 0.014, 0.17]);
    for (const offset of [-0.066, 0.066]) {
      // Perforated mounting tabs sit on the base plate; anchors are not included.
      plate([[-0.021, -0.06], [0.021, -0.06], [0.021, 0.06], [-0.021, 0.06]], {
        depth: 0.008, holes: [[0, 0, 0.007]], center: [x + offset, 0.052, z], rotation: [Math.PI / 2, 0, 0],
      });
      bolt([x + offset, 0.05, z - 0.044], "y");
    }
  }
  perforatedPost(x);
  brace(x, 0.11, 0.56, 0.8, postZ, 0.055, 0.055);
  for (const edge of [-1, 1]) {
    plate([[0.15, 0.113], [0.3, 0.113], [0.255, 0.32], [0.185, 0.32]], {
      center: [x + edge * 0.043 + 0.003, 0, 0], rotation: [0, -Math.PI / 2, 0],
    });
    box([x + edge * 0.042, 0.116, postZ], [0.014, 0.009, 0.15]);
    bolt([x + edge * 0.048, 0.205, postZ], "x");
    bolt([x + edge * 0.032, 0.145, 0.54], "x");
  }
  box([x, 0.114, 0.54], [0.07, 0.008, 0.1]);
  cup(x, side);
  spotter(x, side);

  // Upper gussets and bolted bar mounts.
  box([x, 2.045, 0.165], [0.104, 0.164, 0.021], MATERIAL.frame);
  for (const edge of [-1, 1]) box([x + edge * 0.047, 2.045, 0.22], [0.01, 0.164, 0.13], MATERIAL.frame);
  for (const y of [1.99, 2.105]) {
    bolt([x, y, 0.152], "z");
    bolt([x + side * 0.054, y, postZ], "x");
  }
  bolt([x + side * 0.043, 0.74, postZ + 0.025], "x");
  // Pull-up bar standoff and collar give the round bar a visible support path.
  box([x, 2.065, 0.101], [0.07, 0.048, 0.11], MATERIAL.frame);
  pin([x, 2.08, 0.065], 0.03, 0.025, "x", MATERIAL.frame, 20);
}

// Rear crossmembers tie the base and uprights together without closing the training area.
box([0, 0.12, 0.54], [1.105, 0.08, 0.075]);
for (const side of [-1, 1]) {
  box([side * 0.466, 0.12, 0.54], [0.014, 0.107, 0.11]);
  for (const z of [0.51, 0.57]) bolt([side * 0.456, 0.12, z], "x");
}
box([0, 2.045, postZ], [1.105, 0.09, 0.075]);
pin([0, 2.08, 0.065], 1.105, 0.017, "x", MATERIAL.hardware, 24);
for (const side of [-1, 1]) {
  pin([side * 0.35, 2.08, 0.065], 0.24, 0.019, "x", MATERIAL.rubber, 24);
  for (const edge of [-1, 1]) pin([side * 0.35 + edge * 0.118, 2.08, 0.065], 0.006, 0.02, "x", MATERIAL.rubber, 24);
}
box([0, 2.045, 0.177], [0.25, 0.055, 0.012], MATERIAL.frame);
box([0, 2.045, 0.169], [0.12, 0.012, 0.005], MATERIAL.hardware);

model.orientFacesToNormals();
await writeProceduralGlb(model, OUTPUT);
