import type { InputHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

export function FileInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="file" className={cn('min-h-11 w-full rounded-ui border border-border-strong bg-surface-elevated px-3 py-2 text-sm text-text-secondary file:mr-3 file:rounded-sm file:border-0 file:bg-primary-soft file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-primary-hover hover:border-text-muted/60 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-elevated focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-page disabled:text-text-muted disabled:opacity-75', className)} {...props} />;
}
