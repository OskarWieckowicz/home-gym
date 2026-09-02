import { z } from "zod";

import { trainingGoalSchema } from "@/shared/schemas/training-goal";
import { productIdSchema } from "@/shared/schemas/product-id";

import {
  clearanceMarginsSchema,
  centimetersSchema,
  dimensionsSchema,
  footprintDimensionsSchema,
  positionSchema,
  positiveCentimetersSchema,
  rotationSchema,
} from "./geometry";

export const PROJECT_VERSION = 6 as const;
export const PROJECT_ENTITY_ID_PATTERN = /^obstacle_[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
export const WALL_ELEMENT_ID_PATTERN = /^wall-element_[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
export const PLACEMENT_ID_PATTERN = /^placement_[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
export const PROJECT_ITEM_ID_PATTERN = /^project-item_[a-z0-9]+(?:[-_][a-z0-9]+)*$/;
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
    functionalClearance: clearanceMarginsSchema,
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

export const projectItemSchema = z
  .object({
    id: z.string().regex(PROJECT_ITEM_ID_PATTERN),
    productId: productIdSchema,
  })
  .strict();

export const placementSchema = z
  .object({
    id: z.string().regex(PLACEMENT_ID_PATTERN),
    projectItemId: projectItemSchema.shape.id,
    locked: z.boolean().default(false),
    position: positionSchema,
    rotation: rotationSchema,
  })
  .strict();

function addUniqueIdIssues(
  context: z.RefinementCtx,
  ids: readonly string[],
  path: string,
  message: string,
) {
  const seen = new Set<string>();
  ids.forEach((id, index) => {
    if (seen.has(id)) {
      context.addIssue({
        code: "custom",
        message,
        path: [path, index, "id"],
      });
    }
    seen.add(id);
  });
}

export const gymProjectSchema = z
  .object({
    version: z.literal(PROJECT_VERSION),
    room: roomSchema,
    obstacles: z.array(obstacleSchema),
    wallElements: z.array(wallElementSchema),
    projectItems: z.array(projectItemSchema),
    placements: z.array(placementSchema),
    budget: projectSettingsSchema.shape.budget,
    trainingGoals: projectSettingsSchema.shape.trainingGoals,
  })
  .strict()
  .superRefine(({ obstacles, wallElements, projectItems, placements }, context) => {
    addUniqueIdIssues(context, obstacles.map(({ id }) => id), "obstacles", "Obstacle IDs must be unique.");
    addUniqueIdIssues(
      context,
      wallElements.map(({ id }) => id),
      "wallElements",
      "Wall element IDs must be unique.",
    );
    addUniqueIdIssues(
      context,
      projectItems.map(({ id }) => id),
      "projectItems",
      "Project item IDs must be unique.",
    );
    addUniqueIdIssues(
      context,
      placements.map(({ id }) => id),
      "placements",
      "Placement IDs must be unique.",
    );

    const itemIds = new Set(projectItems.map(({ id }) => id));
    const placedItemIds = new Set<string>();
    placements.forEach((placement, index) => {
      if (!itemIds.has(placement.projectItemId)) {
        context.addIssue({
          code: "custom",
          message: "Placement must reference an existing project item.",
          path: ["placements", index, "projectItemId"],
        });
        return;
      }
      if (placedItemIds.has(placement.projectItemId)) {
        context.addIssue({
          code: "custom",
          message: "A project item may have at most one placement.",
          path: ["placements", index, "projectItemId"],
        });
      }
      placedItemIds.add(placement.projectItemId);
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
export type ProjectItem = z.infer<typeof projectItemSchema>;
export type Placement = z.infer<typeof placementSchema>;
export type GymProject = z.infer<typeof gymProjectSchema>;
