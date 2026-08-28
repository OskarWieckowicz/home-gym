import { gymProjectSchema, type GymProject } from "./schemas/project";

const DEFAULT_PROJECT_INPUT = {
  version: 2,
  room: { widthCm: 400, depthCm: 320, heightCm: 240 },
  obstacles: [],
  wallElements: [],
  budget: 10_000,
  trainingGoals: [],
} as const;

export function createDefaultProject(): GymProject {
  return gymProjectSchema.parse(DEFAULT_PROJECT_INPUT);
}
