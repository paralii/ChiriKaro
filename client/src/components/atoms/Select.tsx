import type { SelectHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('h-11 w-full rounded-ui border border-border-strong bg-surface-elevated px-3 text-sm text-text-primary transition-[color,background-color,border-color,box-shadow] duration-interactive hover:border-text-muted/60 focus-visible:border-focus focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-1 focus-visible:ring-offset-surface-elevated focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-page disabled:text-text-muted disabled:opacity-75', className)} {...props} />;
}
