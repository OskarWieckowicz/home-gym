"use client";

import { useRef, useState, type FormEvent } from "react";

import { projectSettingsSchema, type ProjectSettings } from "@/features/project/schemas/project";
import { TRAINING_GOALS } from "@/shared/schemas/training-goal";

import { useProjectStore, useProjectStoreApi } from "../store/project-store-context";
import { GOAL_LABELS } from "../training-goal-labels";
import { FormActions, NumberField, readInteger } from "./form-controls";

function settingsKey(settings: ProjectSettings) {
  return JSON.stringify([settings.budget, [...settings.trainingGoals].sort()]);
}

export function ProjectSettingsForm({ onSaved, onCancel }: {
  readonly onSaved: () => void;
  readonly onCancel: () => void;
}) {
  const store = useProjectStoreApi();
  const project = useProjectStore((state) => state.project);
  const [baseline, setBaseline] = useState<ProjectSettings>(() => ({ budget: project.budget, trainingGoals: project.trainingGoals }));
  const [budget, setBudget] = useState(String(project.budget));
  const [goals, setGoals] = useState(project.trainingGoals);
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const settingsChanged = settingsKey(project) !== settingsKey(baseline);

  function reloadSettings() {
    const current = store.getState().project;
    setBaseline({ budget: current.budget, trainingGoals: current.trainingGoals });
    setBudget(String(current.budget));
    setGoals(current.trainingGoals);
    setError("");
    // Keep focus in the form when the conflict action disappears.
    formRef.current?.querySelector<HTMLInputElement>("input[name=budget]")?.focus();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settingsKey(store.getState().project) !== settingsKey(baseline)) return;
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
    const result = store.getState().dispatch({ type: "PROJECT_SETTINGS_UPDATED", payload: parsed.data });
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    onSaved();
  }

  return (
    <form className="creator-form" noValidate onSubmit={submit} ref={formRef}>
      {settingsChanged ? <div className="creator-settings-conflict">
        <p role="alert">Project settings changed while this window was open. Reload current settings before applying your changes.</p>
        <button onClick={reloadSettings} type="button">Reload current settings</button>
      </div> : null}
      <div className="creator-settings-fields">
      <NumberField value={budget} onChange={(event) => setBudget(event.currentTarget.value)} id="project-budget" label="Budget" min="0" name="budget" step="1" />
      <fieldset>
        <legend>Training goals</legend>
        <div className="creator-check-grid">
          {TRAINING_GOALS.map((goal) => (
            <label key={goal}>
              <input checked={goals.includes(goal)} onChange={(event) => setGoals(event.currentTarget.checked ? [...goals, goal] : goals.filter((value) => value !== goal))} name="trainingGoals" type="checkbox" value={goal} />
              {GOAL_LABELS[goal]}
            </label>
          ))}
        </div>
      </fieldset>
      </div>
      {error ? <p className="creator-form-error" role="alert">{error}</p> : null}
      <FormActions>
        <button onClick={onCancel} type="button">Cancel</button>
        <button className="creator-primary" disabled={settingsChanged} type="submit">Apply settings</button>
      </FormActions>
    </form>
  );
}
