import { addGlbToComposition } from "./lib/glb-composition.mjs";
import { addStationBar, addStationBench, addStationSparePlates, STATION_MATERIAL } from "./lib/strength-station-parts.mjs";
import { ProceduralGlb, writeProceduralGlb } from "./lib/procedural-glb.mjs";

const OUTPUT = process.argv[2] ?? "public/assets/strength-station-composition.glb";
const MATERIAL = STATION_MATERIAL;

const model = new ProceduralGlb({
  generator: "Home Gym Creator render-only strength station composition v2; detailed loaded station",
  materials: [
    { name: "Graphite powder coat", baseColorFactor: [0.042, 0.049, 0.06, 1], metallicFactor: 0.65, roughnessFactor: 0.4 },
    { name: "Safety orange", baseColorFactor: [0.88, 0.2, 0.035, 1], metallicFactor: 0.4, roughnessFactor: 0.34 },
    { name: "Black rubber and UHMW", baseColorFactor: [0.008, 0.01, 0.013, 1], metallicFactor: 0, roughnessFactor: 0.88 },
    { name: "Zinc hardware", baseColorFactor: [0.52, 0.57, 0.62, 1], metallicFactor: 0.9, roughnessFactor: 0.23 },
    { name: "Brushed steel", baseColorFactor: [0.43, 0.47, 0.51, 1], metallicFactor: 0.95, roughnessFactor: 0.19 },
    { name: "Charcoal upholstery", baseColorFactor: [0.018, 0.019, 0.022, 1], metallicFactor: 0.01, roughnessFactor: 0.82 },
    { name: "Dark chrome shaft", baseColorFactor: [0.12, 0.14, 0.16, 1], metallicFactor: 0.94, roughnessFactor: 0.22 },
    { name: "Knurled grip bands", baseColorFactor: [0.055, 0.06, 0.065, 1], metallicFactor: 0.86, roughnessFactor: 0.42 },
  ],
});

await addGlbToComposition(model, "public/assets/squat-rack.glb", {
  materialMap: [MATERIAL.graphite, MATERIAL.orange, MATERIAL.rubber, MATERIAL.zinc, MATERIAL.steel],
});
// These parts share the rack's materials and are rendered as one planning item.
addStationBench(model);
addStationBar(model);
addStationSparePlates(model);
model.orientFacesToNormals();
await writeProceduralGlb(model, OUTPUT);
