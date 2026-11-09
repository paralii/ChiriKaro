import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

const tones = {
  error: 'border-[#f1cfcb] bg-[#fff2f0] text-[#8e2d2b]',
  success: 'border-[#c9e5dc] bg-[#eff9f5] text-[#286b5a]',
  warning: 'border-[#f0dfbd] bg-[#fff8e9] text-[#795612]',
};

export function Notice({ tone, className, children }: { tone: keyof typeof tones; className?: string; children: ReactNode }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={cn('mb-4 rounded-md border px-3.25 py-2.75 text-xs leading-normal wrap-break-word', tones[tone], className)}>{children}</div>;
}
