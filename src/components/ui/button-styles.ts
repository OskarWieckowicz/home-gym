export const BUTTON_VARIANTS = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  secondary:
    "border border-line bg-surface text-ink hover:border-brand hover:text-brand",
  quiet: "text-ink-muted hover:text-ink",
} as const;

const BUTTON_BASE =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return [BUTTON_BASE, BUTTON_VARIANTS[variant], className]
    .filter(Boolean)
    .join(" ");
}
