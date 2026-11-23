import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={cn('mt-6.5 rounded-lg border border-border bg-surface-elevated shadow-sm', className)}>{children}</section>;
}
