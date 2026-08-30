import { describe, expect, it } from "vitest";

import { createProjectStore } from "@/features/creator/store/project-store";
import { createDefaultProject } from "@/features/project/defaults";

import { catalogWebMcpTools } from "./register-catalog-tools";
import { createRoomWebMcpTools } from "./register-room-tools";
import { createSummaryWebMcpTools } from "./register-summary-tools";

// Project budget, not a WebMCP standard limit. The Codex browser adapter checked
// on 2026-08-30 defaults to 65,536 bytes, including origin/pageUrl metadata.
// Reserve 5,536 bytes for that metadata rather than depending on a short dev URL.
const DESCRIPTOR_BUDGET_BYTES = 60_000;

describe("WebMCP descriptor budget", () => {
  it.each([
    ["creator", () => createRoomWebMcpTools(createProjectStore(createDefaultProject()))],
    ["catalog", () => catalogWebMcpTools],
    ["summary", () => createSummaryWebMcpTools(createProjectStore(createDefaultProject()))],
  ] as const)("keeps the complete %s tool set within the UTF-8 byte budget", (_, createTools) => {
    // JSON serialization excludes execute functions, but includes all advertised
    // names, titles, descriptions, schemas and annotations (without pretty-printing).
    const bytes = new TextEncoder().encode(JSON.stringify(createTools())).byteLength;
    expect(bytes, `Tool descriptors use ${bytes} bytes; budget is ${DESCRIPTOR_BUDGET_BYTES}.`)
      .toBeLessThanOrEqual(DESCRIPTOR_BUDGET_BYTES);
  });
});
