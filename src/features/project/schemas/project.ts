import { z } from "zod";

import { trainingGoalSchema } from "@/shared/schemas/training-goal";

import {
  centimetersSchema,
  dimensionsSchema,
  footprintDimensionsSchema,
  positionSchema,
  positiveCentimetersSchema,
  rotationSchema,
} from "./geometry";

export const PROJECT_VERSION = 2 as const;
export const PROJECT_ENTITY_ID_PATTERN = /^obstacle_[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
export const WALL_ELEMENT_ID_PATTERN = /^wall-element_[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
export const PROJECT_NAME_MAX_LENGTH = 80;

export const roomSchema = z
  .object({
    widthCm: dimensionsSchema.shape.widthCm,
    depthCm: dimensionsSchema.shape.depthCm,
    heightCm: dimensionsSchema.shape.heightCm,
  })
  .strict();

export const obstacleKindSchema = z.enum(["obstacle", "unavailable-zone"]);

const obstacleBaseShape = {
  id: z.string().regex(PROJECT_ENTITY_ID_PATTERN),
  name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH),
  position: positionSchema,
  rotation: rotationSchema,
  locked: z.boolean(),
};

export const physicalObstacleSchema = z
  .object({
    ...obstacleBaseShape,
    kind: z.literal("obstacle"),
    dimensions: dimensionsSchema,
  })
  .strict();

export const unavailableZoneSchema = z
  .object({
    ...obstacleBaseShape,
    kind: z.literal("unavailable-zone"),
    dimensions: footprintDimensionsSchema,
  })
  .strict();

export const obstacleSchema = z.discriminatedUnion("kind", [
  physicalObstacleSchema,
  unavailableZoneSchema,
]);

export const wallSchema = z.enum(["top", "right", "bottom", "left"]);
export const wallElementKindSchema = z.enum(["door", "window"]);

export const wallElementSchema = z
  .object({
    id: z.string().regex(WALL_ELEMENT_ID_PATTERN),
    kind: wallElementKindSchema,
    name: z.string().trim().min(1).max(PROJECT_NAME_MAX_LENGTH),
    wall: wallSchema,
    offsetCm: centimetersSchema,
    widthCm: positiveCentimetersSchema,
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
    wallElements: z.array(wallElementSchema),
    budget: projectSettingsSchema.shape.budget,
    trainingGoals: projectSettingsSchema.shape.trainingGoals,
  })
  .strict()
  .superRefine(({ obstacles, wallElements }, context) => {
    const seenObstacleIds = new Set<string>();

    obstacles.forEach((obstacle, index) => {
      if (seenObstacleIds.has(obstacle.id)) {
        context.addIssue({
          code: "custom",
          message: "Obstacle IDs must be unique.",
          path: ["obstacles", index, "id"],
        });
      }
      seenObstacleIds.add(obstacle.id);
    });

    const seenWallElementIds = new Set<string>();
    wallElements.forEach((wallElement, index) => {
      if (seenWallElementIds.has(wallElement.id)) {
        context.addIssue({
          code: "custom",
          message: "Wall element IDs must be unique.",
          path: ["wallElements", index, "id"],
        });
      }
      seenWallElementIds.add(wallElement.id);
    });
  });

export type Room = z.infer<typeof roomSchema>;
export type ObstacleKind = z.infer<typeof obstacleKindSchema>;
export type Obstacle = z.infer<typeof obstacleSchema>;
export type PhysicalObstacle = z.infer<typeof physicalObstacleSchema>;
export type UnavailableZone = z.infer<typeof unavailableZoneSchema>;
export type Wall = z.infer<typeof wallSchema>;
export type WallElementKind = z.infer<typeof wallElementKindSchema>;
export type WallElement = z.infer<typeof wallElementSchema>;
export type ProjectSettings = z.infer<typeof projectSettingsSchema>;
export type GymProject = z.infer<typeof gymProjectSchema>;
