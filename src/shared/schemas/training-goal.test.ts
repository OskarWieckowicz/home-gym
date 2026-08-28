import { describe, expect, it } from "vitest";
import { z } from "zod";

import { TRAINING_GOALS, trainingGoalSchema } from "./training-goal";

describe("trainingGoalSchema", () => {
  it("accepts the shared training-goal vocabulary", () => {
    expect(TRAINING_GOALS.map((goal) => trainingGoalSchema.parse(goal))).toEqual(
      TRAINING_GOALS,
    );
  });

  it.each(["powerlifting", "Strength", "", 1, null])(
    "rejects unsupported value %j",
    (value) => {
      expect(trainingGoalSchema.safeParse(value).success).toBe(false);
    },
  );

  it("has a reusable enum JSON Schema", () => {
    expect(z.toJSONSchema(trainingGoalSchema)).toMatchObject({
      type: "string",
      enum: [...TRAINING_GOALS],
    });
  });
});
