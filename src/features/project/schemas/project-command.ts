import { z } from "zod";

import { productIdSchema } from "@/shared/schemas/product-id";

import {
  dimensionsSchema,
  footprintDimensionsSchema,
  positionSchema,
  rotationSchema,
} from "./geometry";
import {
  physicalObstacleSchema,
  placementSchema,
  projectItemSchema,
  projectSettingsSchema,
  roomSchema,
  unavailableZoneSchema,
  wallElementSchema,
  wallSchema,
} from "./project";

export const PROJECT_COMMAND_TYPES = [
  "ROOM_CONFIGURED",
  "PROJECT_SETTINGS_UPDATED",
  "OBSTACLE_ADDED",
  "OBSTACLE_UPDATED",
  "OBSTACLE_REMOVED",
  "WALL_ELEMENT_ADDED",
  "WALL_ELEMENT_UPDATED",
  "WALL_ELEMENT_REMOVED",
  "PROJECT_ITEM_ADDED",
  "PROJECT_ITEM_REMOVED",
  "PROJECT_ITEM_PLACED",
  "PRODUCT_PLACED",
  "PLACEMENT_UPDATED",
  "PLACEMENT_REMOVED",
] as const;

const settingsFields = {
  budget: projectSettingsSchema.shape.budget.optional(),
  trainingGoals: projectSettingsSchema.shape.trainingGoals.optional(),
};

export const projectSettingsPatchSchema = z.union([
  z.object({ ...settingsFields, budget: projectSettingsSchema.shape.budget }).strict(),
  z
    .object({
      ...settingsFields,
      trainingGoals: projectSettingsSchema.shape.trainingGoals,
    })
    .strict(),
]);

export const obstacleInputSchema = z.discriminatedUnion("kind", [
  physicalObstacleSchema.omit({ id: true }),
  unavailableZoneSchema.omit({ id: true }),
]);

const obstacleDimensionsSchema = z.union([
  dimensionsSchema,
  footprintDimensionsSchema,
]);

const obstaclePatchFields = {
  name: physicalObstacleSchema.shape.name.optional(),
  position: positionSchema.optional(),
  dimensions: obstacleDimensionsSchema.optional(),
  rotation: rotationSchema.optional(),
  locked: z.boolean().optional(),
};

export const obstaclePatchSchema = z.union([
  z.object({ ...obstaclePatchFields, name: physicalObstacleSchema.shape.name }).strict(),
  z.object({ ...obstaclePatchFields, position: positionSchema }).strict(),
  z.object({ ...obstaclePatchFields, dimensions: obstacleDimensionsSchema }).strict(),
  z.object({ ...obstaclePatchFields, rotation: rotationSchema }).strict(),
  z.object({ ...obstaclePatchFields, locked: z.boolean() }).strict(),
]);

export const wallElementInputSchema = wallElementSchema.omit({ id: true });

const wallElementPatchFields = {
  name: wallElementSchema.shape.name.optional(),
  wall: wallSchema.optional(),
  offsetCm: wallElementSchema.shape.offsetCm.optional(),
  widthCm: wallElementSchema.shape.widthCm.optional(),
};

export const wallElementPatchSchema = z.union([
  z.object({ ...wallElementPatchFields, name: wallElementSchema.shape.name }).strict(),
  z.object({ ...wallElementPatchFields, wall: wallSchema }).strict(),
  z.object({ ...wallElementPatchFields, offsetCm: wallElementSchema.shape.offsetCm }).strict(),
  z.object({ ...wallElementPatchFields, widthCm: wallElementSchema.shape.widthCm }).strict(),
]);

const placementPatchFields = {
  locked: z.boolean().optional(),
  position: positionSchema.optional(),
  rotation: rotationSchema.optional(),
};

export const placementPatchSchema = z.union([
  z.object({ ...placementPatchFields, locked: z.boolean() }).strict(),
  z.object({ ...placementPatchFields, position: positionSchema }).strict(),
  z.object({ ...placementPatchFields, rotation: rotationSchema }).strict(),
]);

const roomConfiguredCommandSchema = z
  .object({
    type: z.literal("ROOM_CONFIGURED"),
    payload: roomSchema,
  })
  .strict();

const projectSettingsUpdatedCommandSchema = z
  .object({
    type: z.literal("PROJECT_SETTINGS_UPDATED"),
    payload: projectSettingsPatchSchema,
  })
  .strict();

const obstacleAddedCommandSchema = z
  .object({
    type: z.literal("OBSTACLE_ADDED"),
    payload: obstacleInputSchema,
  })
  .strict();

const obstacleUpdatedCommandSchema = z
  .object({
    type: z.literal("OBSTACLE_UPDATED"),
    payload: z
      .object({
        obstacleId: physicalObstacleSchema.shape.id,
        patch: obstaclePatchSchema,
      })
      .strict(),
  })
  .strict();

const obstacleRemovedCommandSchema = z
  .object({
    type: z.literal("OBSTACLE_REMOVED"),
    payload: z.object({ obstacleId: physicalObstacleSchema.shape.id }).strict(),
  })
  .strict();

const wallElementAddedCommandSchema = z
  .object({
    type: z.literal("WALL_ELEMENT_ADDED"),
    payload: wallElementInputSchema,
  })
  .strict();

const wallElementUpdatedCommandSchema = z
  .object({
    type: z.literal("WALL_ELEMENT_UPDATED"),
    payload: z
      .object({
        wallElementId: wallElementSchema.shape.id,
        patch: wallElementPatchSchema,
      })
      .strict(),
  })
  .strict();

const wallElementRemovedCommandSchema = z
  .object({
    type: z.literal("WALL_ELEMENT_REMOVED"),
    payload: z.object({ wallElementId: wallElementSchema.shape.id }).strict(),
  })
  .strict();

const projectItemAddedCommandSchema = z
  .object({
    type: z.literal("PROJECT_ITEM_ADDED"),
    payload: z.object({ productId: productIdSchema }).strict(),
  })
  .strict();

const projectItemRemovedCommandSchema = z
  .object({
    type: z.literal("PROJECT_ITEM_REMOVED"),
    payload: z.object({ projectItemId: projectItemSchema.shape.id }).strict(),
  })
  .strict();

const projectItemPlacedCommandSchema = z
  .object({
    type: z.literal("PROJECT_ITEM_PLACED"),
    payload: z
      .object({
        projectItemId: projectItemSchema.shape.id,
        position: positionSchema,
        rotation: rotationSchema,
      })
      .strict(),
  })
  .strict();

const productPlacedCommandSchema = z
  .object({
    type: z.literal("PRODUCT_PLACED"),
    payload: z
      .object({
        productId: productIdSchema,
        position: positionSchema,
        rotation: rotationSchema,
      })
      .strict(),
  })
  .strict();

const placementUpdatedCommandSchema = z
  .object({
    type: z.literal("PLACEMENT_UPDATED"),
    payload: z
      .object({
        placementId: placementSchema.shape.id,
        patch: placementPatchSchema,
      })
      .strict(),
  })
  .strict();

const placementRemovedCommandSchema = z
  .object({
    type: z.literal("PLACEMENT_REMOVED"),
    payload: z.object({ placementId: placementSchema.shape.id }).strict(),
  })
  .strict();

export const projectCommandSchema = z.discriminatedUnion("type", [
  roomConfiguredCommandSchema,
  projectSettingsUpdatedCommandSchema,
  obstacleAddedCommandSchema,
  obstacleUpdatedCommandSchema,
  obstacleRemovedCommandSchema,
  wallElementAddedCommandSchema,
  wallElementUpdatedCommandSchema,
  wallElementRemovedCommandSchema,
  projectItemAddedCommandSchema,
  projectItemRemovedCommandSchema,
  projectItemPlacedCommandSchema,
  productPlacedCommandSchema,
  placementUpdatedCommandSchema,
  placementRemovedCommandSchema,
]);

export type ProjectCommandType = (typeof PROJECT_COMMAND_TYPES)[number];
export type ProjectCommand = z.infer<typeof projectCommandSchema>;
