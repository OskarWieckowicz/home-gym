import type { InputHTMLAttributes, ReactNode } from "react";

export function NumberField({
  label,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  readonly label: string;
  readonly error?: string;
}) {
  const errorId = error && props.id ? `${props.id}-error` : undefined;
  return (
    <div className="creator-field">
      <label htmlFor={props.id}>{label}</label>
      <input
        {...props}
        aria-describedby={errorId}
        aria-invalid={Boolean(error)}
        inputMode="numeric"
        type="number"
      />
      {error ? <span className="creator-field-error" id={errorId}>{error}</span> : null}
    </div>
  );
}

export function FormActions({ children }: { readonly children: ReactNode }) {
  return <div className="creator-form-actions">{children}</div>;
}

export function readInteger(form: FormData, name: string): number {
  const raw = form.get(name);
  return typeof raw === "string" && raw.trim() !== "" ? Number(raw) : Number.NaN;
}
