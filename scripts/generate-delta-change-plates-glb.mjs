import { addPlateDisc } from "./lib/equipment-parts.mjs";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/delta-change-plates.glb";
const MATERIAL = { red: 0, blue: 1, yellow: 2, green: 3, hub: 4 };
const model = new ProceduralGlb({
  generator: "Home Gym Creator Delta Change Plates generator v1",
  materials: [
    { name: "Delta red", baseColorFactor: [0.78, 0.035, 0.025, 1], metallicFactor: 0.05, roughnessFactor: 0.62 },
    { name: "Delta blue", baseColorFactor: [0.02, 0.2, 0.72, 1], metallicFactor: 0.05, roughnessFactor: 0.62 },
    { name: "Delta yellow", baseColorFactor: [0.94, 0.63, 0.02, 1], metallicFactor: 0.04, roughnessFactor: 0.64 },
    { name: "Delta green", baseColorFactor: [0.05, 0.48, 0.18, 1], metallicFactor: 0.04, roughnessFactor: 0.64 },
    { name: "Brushed steel hubs", baseColorFactor: [0.48, 0.53, 0.57, 1], metallicFactor: 0.94, roughnessFactor: 0.2 },
  ],
});

// Eight paired fractional discs fill the compact 0.32 x 0.18 x 0.32 m storage envelope.
const plates = [
  { material: MATERIAL.red, thickness: 0.025, radius: 0.16 },
  { material: MATERIAL.red, thickness: 0.025, radius: 0.16 },
  { material: MATERIAL.blue, thickness: 0.025, radius: 0.14 },
  { material: MATERIAL.blue, thickness: 0.025, radius: 0.14 },
  { material: MATERIAL.yellow, thickness: 0.02, radius: 0.12 },
  { material: MATERIAL.yellow, thickness: 0.02, radius: 0.12 },
  { material: MATERIAL.green, thickness: 0.018, radius: 0.1 },
  { material: MATERIAL.green, thickness: 0.018, radius: 0.1 },
];
let cursor = -0.088;
for (const plate of plates) {
  addPlateDisc(model, {
    center: [0, plate.radius, cursor + plate.thickness / 2],
    thickness: plate.thickness,
    radius: plate.radius,
    discMaterial: plate.material,
    hubMaterial: MATERIAL.hub,
    hubRadius: 0.052,
    segments: 32,
  });
  cursor += plate.thickness;
}

await writeProceduralGlb(model, OUTPUT);
