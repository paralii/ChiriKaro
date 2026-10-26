import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const inputClass =
  'h-11 w-full rounded-ui border border-[#cfd2df] bg-white px-3 text-[13px] font-normal text-ink outline-0 transition placeholder:text-[#9a9daa] focus:border-brand focus:ring-[3px] focus:ring-brand/10 read-only:bg-[#f6f6fa] read-only:text-[#737686] disabled:bg-[#f3f4f7] disabled:text-[#9699a5]';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...props} />;
}