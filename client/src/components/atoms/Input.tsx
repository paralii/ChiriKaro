import type { InputHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

export const inputClass =
  'h-11 w-full rounded-ui border border-border-strong bg-surface-elevated px-3 text-sm font-normal text-text-primary outline-none transition-[color,background-color,border-color,box-shadow] duration-interactive placeholder:text-text-muted/80 hover:border-text-muted/60 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-elevated read-only:bg-page read-only:text-text-secondary disabled:cursor-not-allowed disabled:bg-page disabled:text-text-muted disabled:opacity-75';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}
