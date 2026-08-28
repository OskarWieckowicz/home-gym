import { z } from "zod";

import { trainingGoalSchema } from "@/shared/schemas/training-goal";

import { dimensionsSchema, positionSchema, rotationSchema } from "./geometry";

export const PROJECT_VERSION = 1 as const;
export const PROJECT_ENTITY_ID_PATTERN = /^obstacle_[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
export const PROJECT_NAME_MAX_LENGTH = 80;

export const roomSchema = z
  .object({
    widthCm: dimensionsSchema.shape.widthCm,
    depthCm: dimensionsSchema.shape.depthCm,
    heightCm: dimensionsSchema.shape.heightCm,
  })
  .strict();

export const obstacleKindSchema = z.enum(["obstacle", "unavailable-zone"]);

export const obstacleSchema = z
  .object({
    id: z.string().regex(PROJECT_ENTITY_ID_PATTERN),
    kind: obstacleKindSchema,
    name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH),
    position: positionSchema,
    dimensions: dimensionsSchema,
    rotation: rotationSchema,
    locked: z.boolean(),
  })
  .strict();

export const projectSettingsSchema = z
  .object({
    budget: z.number().int().nonnegative(),
    trainingGoals: z.array(trainingGoalSchema).max(5),
  })
  .strict();

export const gymProjectSchema = z
  .object({
    version: z.literal(PROJECT_VERSION),
    room: roomSchema,
    obstacles: z.array(obstacleSchema),
    budget: projectSettingsSchema.shape.budget,
    trainingGoals: projectSettingsSchema.shape.trainingGoals,
  })
  .strict()
  .superRefine(({ obstacles }, context) => {
    const seenIds = new Set<string>();

    obstacles.forEach((obstacle, index) => {
      if (seenIds.has(obstacle.id)) {
        context.addIssue({
          code: "custom",
          message: "Obstacle IDs must be unique.",
          path: ["obstacles", index, "id"],
        });
      }
      seenIds.add(obstacle.id);
    });
  });

export type Room = z.infer<typeof roomSchema>;
export type ObstacleKind = z.infer<typeof obstacleKindSchema>;
export type Obstacle = z.infer<typeof obstacleSchema>;
export type ProjectSettings = z.infer<typeof projectSettingsSchema>;
export type GymProject = z.infer<typeof gymProjectSchema>;
