import demoProject from "./fixtures/demo-project.json";
import type { GymProject } from "./schemas/project";
import { decodeProject } from "./serialization/project-codec";

/** Decode each time so editor mutations never change the bundled baseline. */
export function createDemoProject(): GymProject {
  const decoded = decodeProject(demoProject);
  if (!decoded.success) {
    throw new Error(`Invalid bundled demo project: ${decoded.error.message}`);
  }
  return decoded.project;
}
