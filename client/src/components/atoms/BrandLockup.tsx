import { Link } from "react-router-dom";
import { cn } from "@shared/lib/cn";

export function BrandLockup({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="ChiriKaro home"
      className={cn(
        "inline-flex items-center text-base font-bold text-ink",
        className,
      )}
    >
      <img
        src="/favicon.svg"
        alt="Logo"
        className="size-8.25 rounded-[10px_10px_10px_3px] object-contain"
      />
      <span>ChiriKaro</span>
    </Link>
  );
}