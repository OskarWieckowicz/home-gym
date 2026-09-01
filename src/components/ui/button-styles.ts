export const BUTTON_VARIANTS = {
  primary:
    "border border-action bg-action text-action-contrast shadow-card hover:border-action-strong hover:bg-action-strong hover:shadow-elevated",
  secondary:
    "border border-line-strong bg-surface text-ink shadow-card hover:border-brand hover:bg-surface-muted hover:text-brand",
  quiet: "text-brand hover:bg-brand-soft hover:text-brand-strong",
} as const;

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold transition-[color,background-color,border-color,box-shadow] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return [BUTTON_BASE, BUTTON_VARIANTS[variant], className]
    .filter(Boolean)
    .join(" ");
}
