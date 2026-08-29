export function addBeamBetween(model, { start, end, width, depth, material }) {
  const center = start.map((value, axis) => (value + end[axis]) / 2);
  const deltaY = end[1] - start[1];
  const deltaZ = end[2] - start[2];
  model.addBox({
    center,
    size: [width, depth, Math.hypot(deltaY, deltaZ)],
    material,
    rotation: [-Math.atan2(deltaY, deltaZ), 0, 0],
  });
}

export function addPad(model, options) {
  model.addChamferedBox(options);
}

export function addRubberFoot(model, options) {
  model.addChamferedBox(options);
}

export function addWheel(model, options) {
  model.addCylinder({ axis: "x", segments: 20, ...options });
}

export function addOlympicSleeve(model, { center, length, sleeveRadius, sleeveMaterial, collarMaterial, collarWidth = 0.04, segments = 24 }) {
  model.addCylinder({ center, length, radius: sleeveRadius, axis: "x", material: sleeveMaterial, segments });
  const direction = Math.sign(center[0]) || 1;
  model.addCylinder({
    center: [center[0] - direction * (length + collarWidth) / 2, center[1], center[2]],
    length: collarWidth,
    radius: sleeveRadius * 1.08,
    axis: "x",
    material: collarMaterial,
    segments,
  });
}

export function addPlateDisc(model, { center, thickness, radius, discMaterial, hubMaterial, hubRadius = 0.05, segments = 32 }) {
  model.addCylinder({ center, length: thickness, radius, axis: "z", material: discMaterial, segments });
  model.addCylinder({ center, length: thickness + 0.004, radius: hubRadius, axis: "z", material: hubMaterial, segments });
}
