import { z } from "zod";

import {
  dimensionsSchema,
  positionSchema,
  rotationSchema,
} from "./geometry";
import {
  obstacleKindSchema,
  obstacleSchema,
  projectSettingsSchema,
  roomSchema,
} from "./project";

export const PROJECT_COMMAND_TYPES = [
  "ROOM_CONFIGURED",
  "PROJECT_SETTINGS_UPDATED",
  "OBSTACLE_ADDED",
  "OBSTACLE_UPDATED",
  "OBSTACLE_REMOVED",
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

export const obstacleInputSchema = obstacleSchema.omit({ id: true });

const obstaclePatchFields = {
  kind: obstacleKindSchema.optional(),
  name: obstacleSchema.shape.name.optional(),
  position: positionSchema.optional(),
  dimensions: dimensionsSchema.optional(),
  rotation: rotationSchema.optional(),
  locked: z.boolean().optional(),
};

export const obstaclePatchSchema = z.union([
  z.object({ ...obstaclePatchFields, kind: obstacleKindSchema }).strict(),
  z.object({ ...obstaclePatchFields, name: obstacleSchema.shape.name }).strict(),
  z.object({ ...obstaclePatchFields, position: positionSchema }).strict(),
  z.object({ ...obstaclePatchFields, dimensions: dimensionsSchema }).strict(),
  z.object({ ...obstaclePatchFields, rotation: rotationSchema }).strict(),
  z.object({ ...obstaclePatchFields, locked: z.boolean() }).strict(),
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
        obstacleId: obstacleSchema.shape.id,
        patch: obstaclePatchSchema,
      })
      .strict(),
  })
  .strict();

const obstacleRemovedCommandSchema = z
  .object({
    type: z.literal("OBSTACLE_REMOVED"),
    payload: z.object({ obstacleId: obstacleSchema.shape.id }).strict(),
  })
  .strict();

export const projectCommandSchema = z.discriminatedUnion("type", [
  roomConfiguredCommandSchema,
  projectSettingsUpdatedCommandSchema,
  obstacleAddedCommandSchema,
  obstacleUpdatedCommandSchema,
  obstacleRemovedCommandSchema,
]);

export type ProjectCommandType = (typeof PROJECT_COMMAND_TYPES)[number];
export type ProjectCommand = z.infer<typeof projectCommandSchema>;
