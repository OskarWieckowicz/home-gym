import { addPlateDisc } from "./lib/equipment-parts.mjs";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/foundry-bumper-plates.glb";
const MATERIAL = { rubber: 0, accent: 1, hub: 2 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Foundry Bumper Plates generator v1",
  materials: [
    { name: "Black bumper rubber", baseColorFactor: [0.012, 0.014, 0.017, 1], metallicFactor: 0.01, roughnessFactor: 0.84 },
    { name: "Burnt orange weight marking", baseColorFactor: [0.88, 0.2, 0.035, 1], metallicFactor: 0.08, roughnessFactor: 0.62 },
    { name: "Brushed steel hubs", baseColorFactor: [0.46, 0.5, 0.54, 1], metallicFactor: 0.94, roughnessFactor: 0.2 },
  ],
});

// Six upright discs form the catalog's stored 100 kg set inside its 0.45 × 0.36 × 0.45 m envelope.
const plates = [
  { thickness: 0.075, radius: 0.225 }, { thickness: 0.075, radius: 0.225 },
  { thickness: 0.06, radius: 0.215 }, { thickness: 0.06, radius: 0.215 },
  { thickness: 0.045, radius: 0.2 }, { thickness: 0.045, radius: 0.2 },
];
let cursor = -0.18;
for (const [index, plate] of plates.entries()) {
  const centerZ = cursor + plate.thickness / 2;
  addPlateDisc(model, {
    center: [0, plate.radius, centerZ],
    thickness: plate.thickness,
    radius: plate.radius,
    discMaterial: index < 2 ? MATERIAL.accent : MATERIAL.rubber,
    hubMaterial: MATERIAL.hub,
    hubRadius: 0.052,
    segments: 32,
  });
  cursor += plate.thickness;
}

await writeProceduralGlb(model, OUTPUT);
