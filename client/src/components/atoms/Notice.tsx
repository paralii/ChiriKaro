import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

const tones = {
  error: 'border-danger/25 bg-danger-soft text-danger',
  success: 'border-success/25 bg-success-soft text-success',
  warning: 'border-warning/25 bg-warning-soft text-warning',
};

export function Notice({ tone, className, children }: { tone: keyof typeof tones; className?: string; children: ReactNode }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cn('mb-4 rounded-md border px-4 py-3 text-sm leading-normal wrap-break-word', tones[tone], className)}>{children}</div>;
}
