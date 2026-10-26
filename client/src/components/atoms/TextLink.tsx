import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@/lib/cn';

const base = 'inline-flex items-center gap-2 text-[13px] font-semibold text-brand-deep hover:underline';

export function TextLink({ className, ...props }: LinkProps) {
  return <Link className={cn(base, className)} {...props} />;
}
export function TextButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} className={cn(base, 'cursor-pointer', className)} {...props} />;
}