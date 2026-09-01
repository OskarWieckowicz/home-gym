import type { ComponentProps } from "react";

const CARD_CLASSES = "rounded-2xl border border-line bg-surface shadow-card";

type CardProps = ComponentProps<"div">;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={[CARD_CLASSES, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}
