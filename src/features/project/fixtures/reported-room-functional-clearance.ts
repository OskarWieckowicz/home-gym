import { PROJECT_VERSION, type GymProject } from "../schemas/project";

/** Disposable review fixture; it is never loaded into the user's saved project. */
export const REPORTED_ROOM_FUNCTIONAL_CLEARANCE: GymProject = {
  version: PROJECT_VERSION,
  room: { widthCm: 500, depthCm: 400, heightCm: 250 },
  obstacles: [
    {
      id: "obstacle_wardrobe",
      kind: "obstacle",
      name: "Wardrobe",
      position: { xCm: 0, zCm: 0 },
      dimensions: { widthCm: 180, depthCm: 60, heightCm: 220 },
      functionalClearance: { frontCm: 60, backCm: 0, leftCm: 0, rightCm: 0 },
      rotation: 0,
      locked: true,
    },
    {
      id: "obstacle_desk-chair",
      kind: "obstacle",
      name: "Desk and chair",
      position: { xCm: 260, zCm: 0 },
      dimensions: { widthCm: 120, depthCm: 60, heightCm: 75 },
      functionalClearance: { frontCm: 100, backCm: 0, leftCm: 20, rightCm: 20 },
      rotation: 0,
      locked: true,
    },
  ],
  wallElements: [
    {
      id: "wall-element_main-door",
      kind: "door",
      name: "Main door",
      wall: "bottom",
      offsetCm: 390,
      widthCm: 90,
    },
  ],
  projectItems: [
    { id: "project-item_kettlebell", productId: "product_forge_kettlebell_16kg" },
  ],
  placements: [
    {
      id: "placement_kettlebell",
      projectItemId: "project-item_kettlebell",
      position: { xCm: 50, zCm: 70 },
      rotation: 0,
      locked: false,
    },
  ],
  budget: 2_500,
  trainingGoals: ["strength"],
};
