import { readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

describe("landing capture files", () => {
  it.each(["hero-room-concept", "room-with-obstacles", "goals-budget-symbolic", "equipment-arrangement"])("ships the documented %s asset with correct dimensions", async (name) => {
    const file = path.join(process.cwd(), "public/images/landing", `${name}.webp`);
    const image = await sharp(file).metadata();
    expect(image).toMatchObject({ format: "webp", width: 1040, height: 780 });
    expect(readFileSync(file).length).toBeLessThan(250_000);
    const provenance = readFileSync(path.join(process.cwd(), "docs/LANDING_ASSETS.md"), "utf8");
    expect(provenance).toContain(`${name}.webp`);
  });
});
