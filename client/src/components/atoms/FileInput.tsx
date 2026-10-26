import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export function FileInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="file" className={cn('min-h-11 w-full rounded-ui border border-[#cfd2df] bg-white px-[11px] py-[9px] text-xs focus:border-brand focus:ring-[3px] focus:ring-brand/10 focus:outline-0', className)} {...props} />;
}