import type { ButtonHTMLAttributes } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '@shared/lib/cn';

const base = 'inline-flex items-center gap-2 text-sm font-semibold text-primary-hover underline-offset-4 transition-colors duration-interactive hover:text-primary hover:underline active:text-primary focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

export function TextLink({ className, ...props }: LinkProps) {
  return <Link className={cn(base, className)} {...props} />;
}
export function TextButton({ className, type = 'button', disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type={type} disabled={disabled} className={cn(base, 'cursor-pointer disabled:cursor-not-allowed disabled:opacity-60', className)} {...props} />;
}
