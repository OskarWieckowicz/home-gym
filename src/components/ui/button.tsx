import type { ComponentProps } from "react";

import {
  buttonClassName,
  type ButtonVariant,
} from "@/components/ui/button-styles";

type ButtonProps = ComponentProps<"button"> & {
  readonly variant?: ButtonVariant;
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...buttonProps
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, className)}
      {...buttonProps}
    />
  );
}
