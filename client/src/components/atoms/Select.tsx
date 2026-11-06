import type { SelectHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('min-h-11 rounded-ui border border-[#cfd2df] bg-white px-2.75 py-2.75 text-xs text-ink focus:border-brand focus:ring-[3px] focus:ring-brand/10 focus:outline-0', className)} {...props} />;
}