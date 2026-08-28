"use client";

import { useState, type FormEvent } from "react";

import { projectSettingsSchema } from "@/features/project/schemas/project";
import { TRAINING_GOALS } from "@/shared/schemas/training-goal";

import { useProjectStore } from "../store/project-store-context";
import { FormActions, NumberField, readInteger } from "./form-controls";

const GOAL_LABELS: Record<(typeof TRAINING_GOALS)[number], string> = {
  strength: "Strength",
  "muscle-gain": "Muscle gain",
  conditioning: "Conditioning",
  "general-fitness": "General fitness",
  mobility: "Mobility",
};

export function ProjectSettingsForm() {
  const project = useProjectStore((state) => state.project);
  const revision = useProjectStore((state) => state.revision);
  const dispatch = useProjectStore((state) => state.dispatch);
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const parsed = projectSettingsSchema.safeParse({
      budget: readInteger(data, "budget"),
      trainingGoals: data.getAll("trainingGoals"),
    });
    if (!parsed.success) {
      setError("Budget must be a non-negative whole number and goals must be known values.");
      return;
    }
    setError("");
    dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: parsed.data });
  }

  return (
    <form className="creator-form" key={revision} noValidate onSubmit={submit}>
      <h2>Project settings</h2>
      <NumberField defaultValue={project.budget} id="project-budget" label="Budget" min="0" name="budget" step="1" />
      <fieldset>
        <legend>Training goals</legend>
        <div className="creator-check-grid">
          {TRAINING_GOALS.map((goal) => (
            <label key={goal}>
              <input defaultChecked={project.trainingGoals.includes(goal)} name="trainingGoals" type="checkbox" value={goal} />
              {GOAL_LABELS[goal]}
            </label>
          ))}
        </div>
      </fieldset>
      {error ? <p className="creator-form-error" role="alert">{error}</p> : null}
      <FormActions><button className="creator-primary" type="submit">Apply settings</button></FormActions>
    </form>
  );
}
