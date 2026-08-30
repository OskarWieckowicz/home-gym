import type { GymProject } from "../schemas/project";
import { projectCommandSchema } from "../schemas/project-command";
import { applyProjectCommands, MAX_PROJECT_COMMANDS } from "./apply-project-commands";
import type { ProjectCommandDependencies } from "./project-command-dependencies";

/** Local IDs make previews reproducible without consuming the mutation ID generators. */
export function createPreviewDependencies(
  project: GymProject,
  dependencies: ProjectCommandDependencies,
  reservedReferences: readonly string[] = [],
): ProjectCommandDependencies {
  const reserved = new Set([
    ...project.obstacles,
    ...project.wallElements,
    ...project.projectItems,
    ...project.placements,
  ].map(({ id }) => id).concat(reservedReferences));
  let index = 0;
  const generateId = (kind: string) => {
    let id: string;
    do {
      id = `${kind}_preview_${++index}`;
    } while (reserved.has(id));
    reserved.add(id);
    return id;
  };
  return {
    ...dependencies,
    generateObstacleId: () => generateId("obstacle"),
    generateWallElementId: () => generateId("wall-element"),
    generateProjectItemId: () => generateId("project-item"),
    generatePlacementId: () => generateId("placement"),
  };
}

export function previewProjectCommands(
  project: GymProject,
  commands: unknown,
  dependencies: ProjectCommandDependencies = {},
) {
  if (!Array.isArray(commands) || commands.length > MAX_PROJECT_COMMANDS) {
    return applyProjectCommands(project, commands, dependencies);
  }
  const references = Array.isArray(commands) ? commands.flatMap((command) => {
    const parsed = projectCommandSchema.safeParse(command);
    if (!parsed.success) return [];
    // Only validated canonical reference fields participate. A guessed temporary ID
    // must not accidentally resolve to an entity created during this preview.
    return Object.entries(parsed.data.payload)
      .filter(([key, value]) => key.endsWith("Id") && typeof value === "string")
      .map(([, value]) => value as string);
  }) : [];
  return applyProjectCommands(project, commands,
    createPreviewDependencies(project, dependencies, references));
}
