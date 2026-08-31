import type { TRAINING_GOALS } from "@/shared/schemas/training-goal";

export const GOAL_LABELS: Record<(typeof TRAINING_GOALS)[number], string> = {
  strength: "Strength",
  "muscle-gain": "Muscle gain",
  conditioning: "Conditioning",
  "general-fitness": "General fitness",
  mobility: "Mobility",
};
