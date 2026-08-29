import { addPlateDisc } from "./lib/equipment-parts.mjs";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/cairn-iron-plates.glb";
const MATERIAL = { iron: 0, accent: 1, hub: 2 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Cairn Iron Plates generator v1",
  materials: [
    { name: "Dark machined iron", baseColorFactor: [0.07, 0.075, 0.08, 1], metallicFactor: 0.86, roughnessFactor: 0.42 },
    { name: "Anvil bronze marking", baseColorFactor: [0.5, 0.24, 0.075, 1], metallicFactor: 0.72, roughnessFactor: 0.36 },
    { name: "Brushed steel hubs", baseColorFactor: [0.46, 0.5, 0.54, 1], metallicFactor: 0.95, roughnessFactor: 0.18 },
  ],
});

// Six slim upright discs form the stored 80 kg set inside its 0.45 x 0.24 x 0.45 m envelope.
const plates = [
  { thickness: 0.05, radius: 0.225 }, { thickness: 0.05, radius: 0.225 },
  { thickness: 0.04, radius: 0.2 }, { thickness: 0.04, radius: 0.2 },
  { thickness: 0.028, radius: 0.17 }, { thickness: 0.028, radius: 0.17 },
];
let cursor = -0.118;
for (const [index, plate] of plates.entries()) {
  addPlateDisc(model, {
    center: [0, plate.radius, cursor + plate.thickness / 2],
    thickness: plate.thickness,
    radius: plate.radius,
    discMaterial: index === 0 || index === plates.length - 1 ? MATERIAL.accent : MATERIAL.iron,
    hubMaterial: MATERIAL.hub,
    hubRadius: 0.052,
    segments: 32,
  });
  cursor += plate.thickness;
}

await writeProceduralGlb(model, OUTPUT);
