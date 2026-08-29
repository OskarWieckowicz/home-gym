import { placementSchema, type GymProject, type Placement } from "../schemas/project";
import type { ProjectCommand } from "../schemas/project-command";
import type { CommandErrorCode } from "./command-results";
import type { ResolvedProjectCommandDependencies } from "./project-command-dependencies";

export type PlacementCommand = Extract<
  ProjectCommand,
  { type: "PRODUCT_PLACED" | "PLACEMENT_UPDATED" | "PLACEMENT_REMOVED" }
>;

export type PlacementMutation =
  | {
      readonly ok: true;
      readonly project: GymProject;
      readonly affectedEntityIds: readonly string[];
    }
  | {
      readonly ok: false;
      readonly code: CommandErrorCode;
    };

function placementsEqual(first: Placement, second: Placement): boolean {
  return (
    first.id === second.id &&
    first.productId === second.productId &&
    first.position.xCm === second.position.xCm &&
    first.position.zCm === second.position.zCm &&
    first.rotation === second.rotation
  );
}

export function applyPlacementCommand(
  project: GymProject,
  command: PlacementCommand,
  dependencies: ResolvedProjectCommandDependencies,
): PlacementMutation {
  if (command.type === "PRODUCT_PLACED") {
    if (!dependencies.resolveProduct(command.payload.productId)) {
      return { ok: false, code: "ENTITY_NOT_FOUND" };
    }
    const id = dependencies.generatePlacementId();
    if (project.placements.some((placement) => placement.id === id)) {
      return { ok: false, code: "ID_CONFLICT" };
    }
    const parsed = placementSchema.safeParse({ id, ...command.payload });
    if (!parsed.success) {
      return { ok: false, code: "EXECUTION_FAILED" };
    }
    return {
      ok: true,
      project: { ...project, placements: [...project.placements, parsed.data] },
      affectedEntityIds: [id],
    };
  }

  const current = project.placements.find(
    ({ id }) => id === command.payload.placementId,
  );
  if (!current) {
    return { ok: false, code: "ENTITY_NOT_FOUND" };
  }

  if (command.type === "PLACEMENT_REMOVED") {
    return {
      ok: true,
      project: {
        ...project,
        placements: project.placements.filter(({ id }) => id !== current.id),
      },
      affectedEntityIds: [current.id],
    };
  }

  const parsed = placementSchema.safeParse({ ...current, ...command.payload.patch });
  if (!parsed.success) {
    return { ok: false, code: "EXECUTION_FAILED" };
  }
  if (placementsEqual(current, parsed.data)) {
    return { ok: true, project, affectedEntityIds: [current.id] };
  }

  return {
    ok: true,
    project: {
      ...project,
      placements: project.placements.map((placement) =>
        placement.id === current.id ? parsed.data : placement,
      ),
    },
    affectedEntityIds: [current.id],
  };
}

