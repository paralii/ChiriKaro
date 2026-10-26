import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  error: 'border-[#f1cfcb] bg-[#fff2f0] text-[#8e2d2b]',
  success: 'border-[#c9e5dc] bg-[#eff9f5] text-[#286b5a]',
};

export function Notice({ tone, className, children }: { tone: keyof typeof tones; className?: string; children: ReactNode }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cn('mb-4 rounded-md border px-[13px] py-[11px] text-xs leading-normal break-words', tones[tone], className)}>{children}</div>;
}