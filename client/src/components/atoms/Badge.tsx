import type { ReactNode } from "react";
import { cn } from "@shared/lib/cn";

const tones = {
  pill: "bg-success-soft text-success",
  pending: "bg-warning-soft text-warning",
  approved: "bg-success-soft text-success",
  rejected: "bg-danger-soft text-danger",
  blocked: "bg-page text-text-secondary",
  neutral: "bg-page text-text-secondary",
};
export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block rounded-sm px-2 py-1.25 text-xs leading-tight font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
