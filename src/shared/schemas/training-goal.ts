import { z } from "zod";

export const TRAINING_GOALS = [
  "strength",
  "muscle-gain",
  "conditioning",
  "general-fitness",
  "mobility",
] as const;

export const trainingGoalSchema = z.enum(TRAINING_GOALS);

export type TrainingGoal = z.infer<typeof trainingGoalSchema>;
