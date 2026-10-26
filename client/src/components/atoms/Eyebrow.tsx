import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return <p className={cn('m-0 text-[11px] leading-[1.4] font-bold text-muted', className)}>{children}</p>;
}