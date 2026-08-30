import type { Rotation } from "@/features/project/schemas/geometry";

// Domain fronts: +Z, -X, -Z, +X at 0/90/180/270 degrees.
// Accepted assets face -Z. Three.js positive Y yaw is the inverse of domain rotation.
// SVG uses the negative of this yaw because its Y axis represents world +Z.
export function equipmentVisualRotation(rotation: Rotation): Rotation {
  return ((180 - rotation + 360) % 360) as Rotation;
}
