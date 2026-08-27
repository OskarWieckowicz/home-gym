import Link from "next/link";
import type { ComponentProps } from "react";

const VARIANT_CLASSES = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  secondary:
    "border border-line bg-surface text-ink hover:border-brand hover:text-brand",
  quiet: "text-ink-muted hover:text-ink",
} as const;

const BASE_CLASSES =
  "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export type LinkButtonVariant = keyof typeof VARIANT_CLASSES;

type LinkButtonProps = ComponentProps<typeof Link> & {
  readonly variant?: LinkButtonVariant;
};

export function LinkButton({
  variant = "primary",
  className,
  ...linkProps
}: LinkButtonProps) {
  const classes = [BASE_CLASSES, VARIANT_CLASSES[variant], className]
    .filter(Boolean)
    .join(" ");

  return <Link {...linkProps} className={classes} />;
}
