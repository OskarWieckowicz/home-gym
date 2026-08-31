import { gymProjectSchema, PROJECT_VERSION, type GymProject } from "./schemas/project";

const DEFAULT_PROJECT_INPUT = {
  version: PROJECT_VERSION,
  room: { widthCm: 400, depthCm: 320, heightCm: 240 },
  obstacles: [],
  wallElements: [],
  projectItems: [],
  placements: [],
  budget: 10_000,
  trainingGoals: [],
} as const;

export function createDefaultProject(): GymProject {
  return gymProjectSchema.parse(DEFAULT_PROJECT_INPUT);
}
