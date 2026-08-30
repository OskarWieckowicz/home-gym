import type { GymProject } from "@/features/project/schemas/project";
import { serializeProject } from "@/features/project/serialization/project-codec";

export const PROJECT_EXPORT_FILENAME = "home-gym-project-v4.json";

/** Shared download path; exporting never changes project or persistence state. */
export function downloadProject(project: GymProject): { kind: "error" | "success"; text: string } {
  const serialized = serializeProject(project);
  if (!serialized.success) return { kind: "error", text: serialized.error.message };

  try {
    const objectUrl = URL.createObjectURL(
      new Blob([serialized.json], { type: "application/json;charset=utf-8" }),
    );
    try {
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = PROJECT_EXPORT_FILENAME;
      link.click();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    return { kind: "success", text: "Project exported." };
  } catch {
    return { kind: "error", text: "The project could not be exported. Please try again." };
  }
}
