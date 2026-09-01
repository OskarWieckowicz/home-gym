import type { ProjectStore } from "@/features/creator/store/project-store";
import {
  createSuggestPlacementsHandler,
} from "./batch-tool-handlers";
import { suggestPlacementsJsonSchema } from "./batch-tool-schemas";

import {
  getProductDetailsWebMcpTool,
  searchProductsWebMcpTool,
} from "./register-catalog-tools";
import {
  createAddProductToProjectHandler,
  createPlaceProductHandler,
  createPlaceProjectItemHandler,
  createRemoveProductHandler,
  createUnplaceProductHandler,
  createUpdatePlacementHandler,
} from "./placement-tool-handlers";
import {
  createAddObstacleHandler,
  createAddWallElementHandler,
  createConfigureRoomHandler,
  createGetProjectStateHandler,
  createGetProjectSummaryHandler,
  createRemoveObstacleHandler,
  createRemoveWallElementHandler,
  createUpdateObstacleHandler,
  createUpdateWallElementHandler,
  createUpdateProjectSettingsHandler,
  createValidateLayoutHandler,
} from "./room-tool-handlers";
import {
  addObstacleJsonSchema,
  addProductToProjectJsonSchema,
  addWallElementJsonSchema,
  configureRoomJsonSchema,
  getProjectStateJsonSchema,
  getProjectSummaryJsonSchema,
  placeProjectItemJsonSchema,
  removeObstacleJsonSchema,
  removeWallElementJsonSchema,
  placeProductJsonSchema,
  removeProductJsonSchema,
  unplaceProductJsonSchema,
  updatePlacementJsonSchema,
  updateObstacleJsonSchema,
  updateWallElementJsonSchema,
  updateProjectSettingsJsonSchema,
  validateLayoutJsonSchema,
} from "./room-tool-schemas";
import { registerToolSet, type ToolSetRegistrationResult } from "./register-tool-set";
import type { WebMcpExecutionObserver } from "./execution-activity";
import type { WebMcpTool } from "./types";

const SPATIAL_NOTE =
  "Positions are minimum footprint corners. Use integer centimeters and rotation 0, 90, 180, or 270.";
const VALIDATION_NOTE =
  "The mutation may leave an invalid layout. Inspect validation counts and call validate_layout for details.";

export function createRoomWebMcpTools(store: ProjectStore): readonly WebMcpTool[] {
  return [
    {
      name: "get_project_summary",
      title: "Get the project summary",
      description:
        "Read the live deterministic summary: room, equipment and placement status, USD cost and budget, goal coverage, layout checks, recommendations, and free floor area. Does not change project history.",
      inputSchema: getProjectSummaryJsonSchema,
      annotations: { readOnlyHint: true },
      execute: createGetProjectSummaryHandler(store),
    },
    {
      name: "get_project_state",
      title: "Get current room project state",
      description:
        "Read the live version-5 project, settings, obstacles, wall elements, project items, equipment placements, revision, and undo/redo availability. Use returned canonical IDs with update and remove tools. Call validate_layout when validation details are needed.",
      inputSchema: getProjectStateJsonSchema,
      annotations: { readOnlyHint: true },
      execute: createGetProjectStateHandler(store),
    },
    {
      name: "configure_room",
      title: "Configure room dimensions",
      description: `Set room width, depth, and height in positive integer centimeters. ${VALIDATION_NOTE}`,
      inputSchema: configureRoomJsonSchema,
      execute: createConfigureRoomHandler(store),
    },
    {
      name: "update_project_settings",
      title: "Update room project settings",
      description:
        "Update a non-empty patch with a non-negative integer USD budget and/or up to five canonical training goals. A change creates one shared undo step.",
      inputSchema: updateProjectSettingsJsonSchema,
      execute: createUpdateProjectSettingsHandler(store),
    },
    {
      name: "add_obstacle",
      title: "Add a room obstacle or unavailable zone",
      description: `Add physical furniture as kind obstacle, or a supported floor restriction as unavailable-zone. Do not invent circulation or equipment use zones; access is computed from doors. The project returns the canonical ID. ${SPATIAL_NOTE} ${VALIDATION_NOTE}`,
      inputSchema: addObstacleJsonSchema,
      execute: createAddObstacleHandler(store),
    },
    {
      name: "update_obstacle",
      title: "Update a room obstacle or unavailable zone",
      description: `Update an obstacle by canonical ID with a non-empty patch; kind is immutable. A locked obstacle accepts only { locked: false } until unlocked. ${SPATIAL_NOTE} ${VALIDATION_NOTE}`,
      inputSchema: updateObstacleJsonSchema,
      execute: createUpdateObstacleHandler(store),
    },
    {
      name: "remove_obstacle",
      title: "Remove a room obstacle or unavailable zone",
      description:
        "Remove an obstacle or unavailable zone by canonical ID. Locked obstacles must be unlocked first.",
      inputSchema: removeObstacleJsonSchema,
      execute: createRemoveObstacleHandler(store),
    },
    {
      name: "add_wall_element",
      title: "Add a door or window",
      description:
        "Add a door or window using wall, offset, and width in integer centimeters. The project returns its canonical ID. Doors seed access checks; windows do not. No unavailable zone is implied.",
      inputSchema: addWallElementJsonSchema,
      execute: createAddWallElementHandler(store),
    },
    {
      name: "update_wall_element",
      title: "Update a door or window",
      description:
        "Update a door or window by canonical ID with a non-empty name, wall, offset, or width patch. Kind is immutable. This never changes unavailable zones.",
      inputSchema: updateWallElementJsonSchema,
      execute: createUpdateWallElementHandler(store),
    },
    {
      name: "remove_wall_element",
      title: "Remove a door or window",
      description:
        "Remove a door or window by canonical ID. This does not change unavailable zones.",
      inputSchema: removeWallElementJsonSchema,
      execute: createRemoveWallElementHandler(store),
    },
    {
      name: "validate_layout",
      title: "Validate the current room layout",
      description:
        "Read detailed deterministic validation without changing state. Errors cover collisions, bounds, unavailable zones, use zones, ceiling, budget, wall mounting, blocked doors, and unreachable equipment. Warnings include overlapping use zones and tight access. valid means zero errors. No door reports ACCESS_NOT_EVALUATED. Access uses 75 cm minimum and reports paths below 100 cm as tight application conventions.",
      inputSchema: validateLayoutJsonSchema,
      annotations: { readOnlyHint: true },
      execute: createValidateLayoutHandler(store),
    },
    searchProductsWebMcpTool,
    getProductDetailsWebMcpTool,
    {
      name: "place_product",
      title: "Place catalog equipment in the room",
      description: `Buy and place one floor-capable catalog product in one undo step. Use add_product_to_project for an unplaced or selection-only item. Wall-mounted products must be flush with the rotation wall (0 top, 90 right, 180 bottom, 270 left) and cannot cross openings. IDs are generated. ${SPATIAL_NOTE} ${VALIDATION_NOTE}`,
      inputSchema: placeProductJsonSchema,
      execute: createPlaceProductHandler(store),
    },
    {
      name: "add_product_to_project",
      title: "Add a catalog product to the project without placing it",
      description:
        "Add a catalog product as an unplaced project item. It immediately affects budget and goal coverage. Use place_project_item for floor-capable items; selection-only items cannot be placed. Returns a generated item ID.",
      inputSchema: addProductToProjectJsonSchema,
      execute: createAddProductToProjectHandler(store),
    },
    {
      name: "place_project_item",
      title: "Place an existing project item on the floor",
      description: `Place an existing unplaced floor-capable project item. Selection-only or already placed items are rejected. ${SPATIAL_NOTE} ${VALIDATION_NOTE}`,
      inputSchema: placeProjectItemJsonSchema,
      execute: createPlaceProjectItemHandler(store),
    },
    {
      name: "update_placement",
      title: "Move, rotate, or lock placed equipment",
      description: `Update position, rotation, or lock state by canonical placement ID. Product identity is immutable. Locked equipment accepts only { locked: false }; unlock it before changing pose. ${SPATIAL_NOTE} ${VALIDATION_NOTE}`,
      inputSchema: updatePlacementJsonSchema,
      execute: createUpdatePlacementHandler(store),
    },
    {
      name: "unplace_product",
      title: "Remove equipment from the floor without deleting it",
      description:
        "Remove a floor placement by canonical ID while keeping its project item, cost, and shopping entry. Use remove_product to delete the item. Unlock equipment first.",
      inputSchema: unplaceProductJsonSchema,
      execute: createUnplaceProductHandler(store),
    },
    {
      name: "remove_product",
      title: "Remove a project item and any floor placement",
      description:
        "Remove a project item by canonical projectItemId and remove its placement in the same command. Unlock placed equipment first. The catalog product is unchanged.",
      inputSchema: removeProductJsonSchema,
      execute: createRemoveProductHandler(store),
    },
    {
      name: "suggest_placements",
      title: "Suggest safe equipment placements",
      description:
        "Read deterministic placement candidates without mutation. Supply exactly one productId or projectItemId, with optional rotations, region, and limit. Candidates use a 10 cm grid; errors and unreachable entities reject them, while warnings affect score. Apply a returned pose with place_product, place_project_item, or update_placement. Suggestions never unlock equipment.",
      inputSchema: suggestPlacementsJsonSchema,
      annotations: { readOnlyHint: true },
      execute: createSuggestPlacementsHandler(store),
    },
  ];
}

export function registerRoomTools(
  documentValue: Document,
  controller: AbortController,
  store: ProjectStore,
  observer?: WebMcpExecutionObserver,
): Promise<ToolSetRegistrationResult> {
  return registerToolSet(documentValue, controller, createRoomWebMcpTools(store), observer);
}
