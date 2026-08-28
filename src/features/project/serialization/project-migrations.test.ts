import { describe, expect, it } from "vitest";

import { createDefaultProject } from "../defaults";
import {
  CURRENT_PROJECT_VERSION,
  migrateProjectToCurrent,
  SUPPORTED_PROJECT_VERSIONS,
} from "./project-migrations";

describe("project migrations", () => {
  it("declares version 1 as the current and only supported version", () => {
    expect(CURRENT_PROJECT_VERSION).toBe(1);
    expect(SUPPORTED_PROJECT_VERSIONS).toEqual([1]);
  });

  it("passes the current version through without changing its reference", () => {
    const project = createDefaultProject();

    expect(migrateProjectToCurrent(project, 1)).toEqual({
      success: true,
      data: project,
    });
  });

  it("classifies an older version without a migration as a migration failure", () => {
    expect(migrateProjectToCurrent({ version: 0 }, 0)).toEqual({
      success: false,
      error: {
        code: "migration-failed",
        message: "The saved project could not be migrated from version 0.",
      },
    });
  });
});
