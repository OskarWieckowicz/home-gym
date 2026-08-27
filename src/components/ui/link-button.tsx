import Link from "next/link";
import type { ComponentProps } from "react";

import {
  buttonClassName,
  type ButtonVariant,
} from "@/components/ui/button-styles";

type LinkButtonProps = ComponentProps<typeof Link> & {
  readonly variant?: ButtonVariant;
};

export function LinkButton({
  variant = "primary",
  className,
  ...linkProps
}: LinkButtonProps) {
  return <Link {...linkProps} className={buttonClassName(variant, className)} />;
}
