// Composition-only refinements: standalone catalog assets keep their accepted pose.
import { addBeamBetween } from "./equipment-parts.mjs";

export const STATION_MATERIAL = { graphite: 0, orange: 1, rubber: 2, zinc: 3, steel: 4, upholstery: 5, chrome: 6, grip: 7 };
const M = STATION_MATERIAL;
export const BAR_HEIGHT = 1.467;

export function stationBox(model, center, size, material = M.graphite, rotation = [0, 0, 0]) {
  model.addChamferedBox({ center, size, material, rotation, bevel: Math.min(0.004, size[0] / 4, size[2] / 4) });
}
const cylinder = (model, center, length, radius, material, axis = "x", segments = 12) => {
  model.addCylinder({ center, length, radius, material, axis, segments });
};

// A surface of revolution, with smooth radial normals and crisp profile transitions.
// Each adjoining ring shares its exact coordinates; the metal bore is genuinely open.
export function addStationPlate(model, { center, thickness, radius, axis = "x", material = M.rubber, segments = 24 }) {
  const half = thickness / 2;
  const profile = [[0.026, -half], [0.052, -half], [radius - 0.012, -half],
    [radius, -half + 0.012], [radius, half - 0.012], [radius - 0.012, half],
    [0.052, half], [0.026, half]];
  const orient = (axial, y, z) => axis === "x" ? [axial, y, z] : [z, y, axial];
  for (let edge = 0; edge < profile.length; edge += 1) {
    const a = profile[edge], b = profile[(edge + 1) % profile.length];
    const radialNormal = b[1] - a[1], axialNormal = a[0] - b[0];
    const length = Math.hypot(radialNormal, axialNormal);
    const vertices = [], normals = [], indices = [];
    for (let step = 0; step <= segments; step += 1) {
      const angle = step / segments * Math.PI * 2;
      for (const [radiusAtRing, axial] of [a, b]) {
        vertices.push(...orient(axial, Math.cos(angle) * radiusAtRing, Math.sin(angle) * radiusAtRing));
        normals.push(...orient(axialNormal / length, Math.cos(angle) * radialNormal / length, Math.sin(angle) * radialNormal / length));
      }
      if (step < segments) {
        const first = step * 2;
        indices.push(first, first + 1, first + 2, first + 1, first + 3, first + 2);
      }
    }
    const isHub = edge === 0 || edge === 6 || edge === 7;
    model.addGeometry({ center, vertices, normals, indices, material: isHub ? M.steel : material });
  }
}

export function addStationBar(model) {
  // The bare 28 mm shaft contacts the J-cup liners at 1.453 m.
  cylinder(model, [0, BAR_HEIGHT, -0.59], 1.31, 0.014, M.chrome);
  for (const side of [-1, 1]) {
    cylinder(model, [side * 0.675, BAR_HEIGHT, -0.59], 0.04, 0.038, M.steel);
    cylinder(model, [side * 0.8955, BAR_HEIGHT, -0.59], 0.401, 0.025, M.steel);
    cylinder(model, [side * 1.098, BAR_HEIGHT, -0.59], 0.004, 0.024, M.graphite);
    for (const x of [0.2, 0.41]) cylinder(model, [side * x, BAR_HEIGHT, -0.59], 0.17, 0.0144, M.grip);
    // Two bumper plates per sleeve sit flush against the inner shoulder.
    addStationPlate(model, { center: [side * 0.7325, BAR_HEIGHT, -0.59], thickness: 0.075, radius: 0.225, material: M.orange });
    addStationPlate(model, { center: [side * 0.8, BAR_HEIGHT, -0.59], thickness: 0.06, radius: 0.215 });
    cylinder(model, [side * 0.849, BAR_HEIGHT, -0.59], 0.038, 0.038, M.graphite);
    stationBox(model, [side * 0.849, BAR_HEIGHT + 0.042, -0.59], [0.033, 0.025, 0.018], M.orange);
  }
  cylinder(model, [0, BAR_HEIGHT, -0.59], 0.12, 0.0144, M.grip);
}

export function addStationSparePlates(model) {
  let cursor = 0.17;
  for (const [index, thickness] of [0.075, 0.075, 0.06, 0.06, 0.045, 0.045].entries()) {
    const radius = index < 2 ? 0.225 : index < 4 ? 0.215 : 0.2;
    addStationPlate(model, { center: [0.95, radius, cursor + thickness / 2], thickness, radius,
      axis: "z", material: index < 2 ? M.orange : M.rubber, segments: 16 });
    cursor += thickness;
  }
}

export function addStationBench(model) {
  // Same 35-degree Arc display pose, now with connected frame and pivot hardware.
  const incline = 35 * Math.PI / 180;
  const sin = Math.sin(incline), cos = Math.cos(incline);
  const box = (center, size, material = M.graphite, rotation) => stationBox(model, center, size, material, rotation);
  const beam = (start, end, width = 0.05, depth = 0.05) => addBeamBetween(model, { start, end, width, depth, material: M.graphite });
  box([0, 0.095, -0.015], [0.085, 0.075, 1.22]);
  for (const [z, width] of [[0.57, 0.66], [-0.57, 0.56]]) {
    box([0, 0.052, z], [width, 0.075, 0.11]);
    for (const side of [-1, 1]) {
      box([side * (width / 2 - 0.052), 0.014, z], [0.09, 0.028, 0.14], M.rubber);
      cylinder(model, [side * (width / 2 - 0.08), 0.1, z], 0.012, 0.011, M.zinc, "y", 6);
    }
  }
  for (const x of [-0.15, 0.15]) {
    beam([x, 0.12, 0.48], [x, 0.39, 0.34]);
    beam([x, 0.12, 0.49], [x, 0.37, 0.1], 0.04, 0.04);
  }
  box([0, 0.39, 0.29], [0.37, 0.042, 0.38]);
  const pad = (center, size, material, rotation = [0, 0, 0]) => model.addChamferedBox({
    center, size, material, rotation, bevel: 0.03,
  });
  // Thin piping follows each pad perimeter as a narrow contrasting seam.
  pad([0, 0.437, 0.29], [0.394, 0.006, 0.424], M.rubber);
  pad([0, 0.442, 0.29], [0.39, 0.07, 0.42], M.upholstery);
  const back = [0, 0.43 + sin * 0.42, 0.045 - cos * 0.42];
  const rotation = [incline, 0, 0];
  box([0, back[1] - cos * 0.048, back[2] - sin * 0.048], [0.3, 0.018, 0.78], M.graphite, rotation);
  pad([0, back[1] - cos * 0.019, back[2] - sin * 0.019], [0.344, 0.006, 0.844], M.rubber, rotation);
  pad(back, [0.34, 0.075, 0.84], M.upholstery, rotation);
  // Seat/back hinge is a continuous axle, not two disconnected bolt heads.
  cylinder(model, [0, 0.43, 0.045], 0.428, 0.015, M.zinc);
  for (const side of [-1, 1]) {
    box([side * 0.195, 0.405, 0.045], [0.018, 0.13, 0.13], M.orange);
    cylinder(model, [side * 0.215, 0.43, 0.045], 0.012, 0.022, M.zinc, "x", 6);
    beam([side * 0.105, 0.15, -0.02], [side * 0.105, 0.15, -0.49], 0.026, 0.032);
  }
  for (let step = 0; step < 7; step += 1) box([0, 0.184, -0.075 - step * 0.064], [0.255, 0.04, 0.027]);
  // The inclined strut reaches the back's steel underside and a ladder rung.
  const support = [0, back[1] - cos * 0.06, back[2] - sin * 0.06];
  beam([0, 0.211, -0.459], support, 0.055, 0.045);
  cylinder(model, support, 0.32, 0.012, M.zinc);
  cylinder(model, [0, 0.211, -0.459], 0.27, 0.014, M.zinc);
  for (const x of [-0.145, 0.145]) {
    // Handle brackets and wheel forks attach to the floor spine/crossmember.
    beam([x, 0.09, 0.57], [x, 0.16, 0.67], 0.024, 0.024);
    box([x, 0.103, -0.615], [0.055, 0.09, 0.13], M.orange);
    cylinder(model, [x, 0.075, -0.655], 0.045, 0.058, M.rubber);
    cylinder(model, [x + Math.sign(x) * 0.025, 0.075, -0.655], 0.012, 0.018, M.zinc, "x", 6);
  }
  cylinder(model, [0, 0.16, 0.67], 0.36, 0.018, M.rubber);
}
