import { describe, expect, it } from "vitest";

import { createDefaultProject } from "../defaults";
import { gymProjectSchema, type GymProject } from "../schemas/project";
import {
  decodeProject,
  decodeProjectJson,
  serializeProject,
  type ProjectCodecErrorCode,
} from "./project-codec";

const obstacle = {
  id: "obstacle_power-rack",
  kind: "obstacle",
  name: "Power rack",
  position: { xCm: 20, zCm: 30 },
  dimensions: { widthCm: 120, depthCm: 100, heightCm: 220 },
  rotation: 90,
  locked: false,
} as const;

const project: GymProject = {
  ...createDefaultProject(),
  obstacles: [obstacle],
  projectItems: [
    {
      id: "project-item_power-rack",
      productId: "product_northstar_half_rack",
    },
  ],
  placements: [
    {
      locked: true,
      id: "placement_power-rack",
      projectItemId: "project-item_power-rack",
      position: { xCm: 140, zCm: 80 },
      rotation: 270,
    },
  ],
  trainingGoals: ["strength", "mobility"],
};

describe("project codec", () => {
  it("round-trips a version-5 project through canonical pretty JSON", () => {
    const serialized = serializeProject(project);
    const canonicalProject = gymProjectSchema.parse(project);

    expect(serialized).toEqual({
      success: true,
      json: `${JSON.stringify(canonicalProject, null, 2)}\n`,
    });
    expect(serialized.success && decodeProjectJson(serialized.json)).toEqual({
      success: true,
      project,
    });
  });

  it("normalizes whitespace and field order to the canonical schema order", () => {
    const shuffled = JSON.stringify({
      trainingGoals: [],
      budget: 2_500,
      obstacles: [],
      room: { heightCm: 240, depthCm: 320, widthCm: 400 },
      version: 1,
    });
    const decoded = decodeProjectJson(`  \n${shuffled}\t`);

    expect(decoded).toEqual({ success: true, project: createDefaultProject() });
    expect(decoded.success && serializeProject(decoded.project)).toEqual({
      success: true,
      json: `${JSON.stringify(createDefaultProject(), null, 2)}\n`,
    });
  });

  it("decodes a version-1 unavailable zone as 2D without inferring an opening", () => {
    const decoded = decodeProject({
      version: 1,
      room: { widthCm: 400, depthCm: 320, heightCm: 240 },
      obstacles: [
        {
          id: "obstacle_door-swing",
          kind: "unavailable-zone",
          name: "Door swing",
          position: { xCm: 0, zCm: 0 },
          dimensions: { widthCm: 90, depthCm: 90, heightCm: 10 },
          rotation: 0,
          locked: false,
        },
      ],
      budget: 10_000,
      trainingGoals: [],
    });

    expect(decoded).toEqual({
      success: true,
      project: {
        version: 5,
        room: { widthCm: 400, depthCm: 320, heightCm: 240 },
        obstacles: [
          {
            id: "obstacle_door-swing",
            name: "Door swing",
            position: { xCm: 0, zCm: 0 },
            rotation: 0,
            locked: false,
            kind: "unavailable-zone",
            dimensions: { widthCm: 90, depthCm: 90 },
          },
        ],
        wallElements: [],
        projectItems: [],
        placements: [],
        budget: 10_000,
        trainingGoals: [],
      },
    });
  });

  it("classifies malformed JSON without throwing", () => {
    expectErrorCode(decodeProjectJson("{ nope"), "invalid-json");
  });

  it.each([null, [], "project", 1])(
    "classifies non-object root %j as an invalid version",
    (input) => {
      expectErrorCode(decodeProject(input), "invalid-version");
    },
  );

  it.each([
    ["missing", {}],
    ["string", { version: "1" }],
    ["fractional", { version: 1.5 }],
    ["zero", { version: 0 }],
    ["negative", { version: -1 }],
  ])("classifies %s version as invalid", (_label, input) => {
    expectErrorCode(decodeProject(input), "invalid-version");
  });

  it("rejects future versions before schema parsing", () => {
    expectErrorCode(
      decodeProject({ ...createDefaultProject(), version: 6 }),
      "unsupported-version",
    );
  });

  it.each([
    ["unknown root field", { ...project, selection: null }],
    ["unknown nested field", { ...project, room: { ...project.room, unit: "cm" } }],
    ["invalid geometry", { ...project, room: { ...project.room, widthCm: 0 } }],
    ["duplicate obstacle IDs", { ...project, obstacles: [obstacle, obstacle] }],
  ])("classifies %s as a schema failure", (_label, input) => {
    expectErrorCode(decodeProject(input), "schema-invalid");
  });

  it("validates runtime input at the serialization boundary", () => {
    expectErrorCode(
      serializeProject({ ...project, budget: -1 } as typeof project),
      "schema-invalid",
    );
  });

  it("does not let hostile object accessors throw across the public boundary", () => {
    const input = Object.defineProperty({}, "version", {
      get: () => {
        throw new Error("untrusted accessor");
      },
    });

    expectErrorCode(decodeProject(input), "schema-invalid");
  });
});

function expectErrorCode(
  result:
    | ReturnType<typeof decodeProject>
    | ReturnType<typeof decodeProjectJson>
    | ReturnType<typeof serializeProject>,
  code: ProjectCodecErrorCode,
) {
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.code).toBe(code);
    expect(result.error.message).not.toBe("");
  }
}
