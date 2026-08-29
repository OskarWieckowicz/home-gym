import { z } from "zod";

import {
  obstacleInputSchema,
  obstaclePatchSchema,
  placementPatchSchema,
  projectSettingsPatchSchema,
  wallElementInputSchema,
  wallElementPatchSchema,
} from "@/features/project/schemas/project-command";
import {
  physicalObstacleSchema,
  placementSchema,
  roomSchema,
  wallElementSchema,
} from "@/features/project/schemas/project";

export const getProjectStateInputSchema = z.object({}).strict();
export const validateLayoutInputSchema = z.object({}).strict();
export const configureRoomInputSchema = roomSchema;
export const updateProjectSettingsInputSchema = projectSettingsPatchSchema;
export const addObstacleInputSchema = obstacleInputSchema;
export const updateObstacleInputSchema = z
  .object({
    obstacleId: physicalObstacleSchema.shape.id,
    patch: obstaclePatchSchema,
  })
  .strict();
export const removeObstacleInputSchema = z
  .object({ obstacleId: physicalObstacleSchema.shape.id })
  .strict();
export const addWallElementInputSchema = wallElementInputSchema;
export const updateWallElementInputSchema = z
  .object({
    wallElementId: wallElementSchema.shape.id,
    patch: wallElementPatchSchema,
  })
  .strict();
export const removeWallElementInputSchema = z
  .object({ wallElementId: wallElementSchema.shape.id })
  .strict();
export const placeProductInputSchema = placementSchema.omit({ id: true });
export const updatePlacementInputSchema = z
  .object({
    placementId: placementSchema.shape.id,
    patch: placementPatchSchema,
  })
  .strict();
export const removeProductInputSchema = z
  .object({ placementId: placementSchema.shape.id })
  .strict();

export const getProjectStateJsonSchema = z.toJSONSchema(getProjectStateInputSchema);
export const validateLayoutJsonSchema = z.toJSONSchema(validateLayoutInputSchema);
export const configureRoomJsonSchema = z.toJSONSchema(configureRoomInputSchema);
export const updateProjectSettingsJsonSchema = z.toJSONSchema(
  updateProjectSettingsInputSchema,
);
export const addObstacleJsonSchema = z.toJSONSchema(addObstacleInputSchema);
export const updateObstacleJsonSchema = z.toJSONSchema(updateObstacleInputSchema);
export const removeObstacleJsonSchema = z.toJSONSchema(removeObstacleInputSchema);
export const addWallElementJsonSchema = z.toJSONSchema(addWallElementInputSchema);
export const updateWallElementJsonSchema = z.toJSONSchema(
  updateWallElementInputSchema,
);
export const removeWallElementJsonSchema = z.toJSONSchema(
  removeWallElementInputSchema,
);
export const placeProductJsonSchema = z.toJSONSchema(placeProductInputSchema);
export const updatePlacementJsonSchema = z.toJSONSchema(updatePlacementInputSchema);
export const removeProductJsonSchema = z.toJSONSchema(removeProductInputSchema);

export type ConfigureRoomInput = z.infer<typeof configureRoomInputSchema>;
export type UpdateProjectSettingsInput = z.infer<
  typeof updateProjectSettingsInputSchema
>;
export type AddObstacleInput = z.infer<typeof addObstacleInputSchema>;
export type UpdateObstacleInput = z.infer<typeof updateObstacleInputSchema>;
export type RemoveObstacleInput = z.infer<typeof removeObstacleInputSchema>;
export type AddWallElementInput = z.infer<typeof addWallElementInputSchema>;
export type UpdateWallElementInput = z.infer<typeof updateWallElementInputSchema>;
export type RemoveWallElementInput = z.infer<typeof removeWallElementInputSchema>;
export type PlaceProductInput = z.infer<typeof placeProductInputSchema>;
export type UpdatePlacementInput = z.infer<typeof updatePlacementInputSchema>;
export type RemoveProductInput = z.infer<typeof removeProductInputSchema>;

export type InputIssue = {
  readonly path: string;
  readonly message: string;
};

const ISSUE_MESSAGES: Readonly<Record<string, string>> = {
  widthCm: "Width must be a positive integer number of centimeters.",
  depthCm: "Depth must be a positive integer number of centimeters.",
  heightCm: "Height must be a positive integer number of centimeters.",
  budget: "Budget must be a non-negative integer in PLN.",
  trainingGoals: "Training goals must contain up to five supported goals.",
  obstacleId: "Obstacle ID must use the canonical obstacle ID format.",
  wallElementId: "Wall element ID must use the canonical wall-element ID format.",
  productId: "Product ID must use the canonical catalog product ID format.",
  placementId: "Placement ID must use the canonical placement ID format.",
  kind: "Kind must be obstacle or unavailable-zone.",
  name: "Name must be non-empty text up to 80 characters.",
  position: "Position must use non-negative integer centimeter coordinates.",
  dimensions: "Dimensions must use positive integer centimeter values.",
  rotation: "Rotation must be 0, 90, 180, or 270 degrees.",
  locked: "Locked must be a boolean.",
  patch: "Patch must contain at least one supported field.",
  wall: "Wall must be top, right, bottom, or left.",
  offsetCm: "Offset must be a non-negative integer number of centimeters.",
  input: "Input must contain the required supported fields.",
};

type ZodIssueLike = z.core.$ZodIssue & {
  readonly errors?: readonly (readonly ZodIssueLike[])[];
  readonly keys?: readonly string[];
};

function flattenIssues(
  issue: ZodIssueLike,
  prefix: readonly PropertyKey[] = [],
): readonly ZodIssueLike[] {
  if (issue.code === "invalid_union" && issue.errors) {
    const nestedPrefix = [...prefix, ...issue.path];
    return issue.errors.flatMap((branch) =>
      branch.flatMap((leaf) => flattenIssues(leaf, nestedPrefix)),
    );
  }
  return [{ ...issue, path: [...prefix, ...issue.path] } as ZodIssueLike];
}

function issueMessage(path: readonly PropertyKey[]): string {
  const field = [...path].reverse().find((part) => typeof part === "string");
  return ISSUE_MESSAGES[String(field ?? "input")] ?? "Input is invalid.";
}

export function mapRoomToolInputIssues(error: z.ZodError): InputIssue[] {
  const mapped = error.issues.flatMap((issue) =>
    flattenIssues(issue).flatMap((leaf) => {
      if (leaf.code === "unrecognized_keys" && leaf.keys) {
        return leaf.keys.map((key) => ({
          path: [...leaf.path, key].join("."),
          message: "This field is not supported.",
        }));
      }

      const path = leaf.path.join(".") || "input";
      return [{ path, message: issueMessage(leaf.path) }];
    }),
  );

  return mapped.filter(
    (issue, index) =>
      mapped.findIndex(
        (candidate) =>
          candidate.path === issue.path && candidate.message === issue.message,
      ) === index,
  );
}
