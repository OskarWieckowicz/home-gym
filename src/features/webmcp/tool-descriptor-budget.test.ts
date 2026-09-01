import { describe, expect, it } from "vitest";

import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

import { catalogWebMcpTools } from "./register-catalog-tools";
import { createRoomWebMcpTools } from "./register-room-tools";
import { createSummaryWebMcpTools } from "./register-summary-tools";

// Project budgets, not WebMCP standard limits. Keep the creator well below the
// browser adapter's observed 65,536-byte envelope so schemas do not crowd the
// agent context again.
const MAX_DESCRIPTION_CHARACTERS = 500;

describe("WebMCP descriptor budget", () => {
  it.each([
    ["creator", 30_000, () => createRoomWebMcpTools(createProjectStore(createDefaultProject()))],
    ["catalog", 5_000, () => catalogWebMcpTools],
    ["summary", 1_000, () => createSummaryWebMcpTools(createProjectStore(createDefaultProject()))],
  ] as const)("keeps the complete %s tool set within the UTF-8 byte budget", (_, budget, createTools) => {
    // JSON serialization excludes execute functions, but includes all advertised
    // names, titles, descriptions, schemas and annotations (without pretty-printing).
    const bytes = new TextEncoder().encode(JSON.stringify(createTools())).byteLength;
    expect(bytes, `Tool descriptors use ${bytes} bytes; budget is ${budget}.`)
      .toBeLessThanOrEqual(budget);
    for (const tool of createTools()) {
      expect(tool.description.length, `${tool.name} description is too long.`)
        .toBeLessThanOrEqual(MAX_DESCRIPTION_CHARACTERS);
    }
  });
});
