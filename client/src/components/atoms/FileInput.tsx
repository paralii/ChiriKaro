import type { InputHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

export function FileInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return <input type="file" className={cn('min-h-11 w-full rounded-ui border border-[#cfd2df] bg-white px-2.75 py-2.25 text-xs focus:border-brand focus:ring-[3px] focus:ring-brand/10 focus:outline-0', className)} {...props} />;
}