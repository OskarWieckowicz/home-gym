import { z } from "zod";

export const centimetersSchema = z.number().int().nonnegative();
export const positiveCentimetersSchema = z.number().int().positive();

export const positionSchema = z
  .object({
    xCm: centimetersSchema,
    zCm: centimetersSchema,
  })
  .strict();

export const dimensionsSchema = z
  .object({
    widthCm: positiveCentimetersSchema,
    depthCm: positiveCentimetersSchema,
    heightCm: positiveCentimetersSchema,
  })
  .strict();

export const rotationSchema = z.union([
  z.literal(0),
  z.literal(90),
  z.literal(180),
  z.literal(270),
]);

export type Position = z.infer<typeof positionSchema>;
export type Dimensions = z.infer<typeof dimensionsSchema>;
export type Rotation = z.infer<typeof rotationSchema>;
