import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@shared/lib/cn';

const variants = {
  primary: 'border-transparent bg-primary text-white hover:bg-primary-hover active:bg-primary-hover',
  secondary: 'border-border-strong bg-surface-elevated text-primary-hover hover:border-primary hover:bg-primary-soft active:bg-primary-soft',
  ghost: 'border-border bg-surface-elevated font-semibold text-primary-hover hover:border-primary hover:bg-primary-soft active:bg-primary-soft',
};
const sizes = {
  md: 'min-h-11 gap-3.5 rounded-ui px-4.5 text-sm',
  sm: 'min-h-10 gap-3 rounded-ui px-3.5 text-sm',
  xs: 'min-h-8 gap-1 rounded-sm px-2 py-1.5 text-xs',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants; size?: keyof typeof sizes };

export function Button({ variant = 'primary', size = 'md', className, ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center border font-semibold transition-[color,background-color,border-color,box-shadow,transform] duration-interactive ease-interactive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus active:translate-y-px disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60',
        variants[variant], sizes[size], className,
      )}
      {...props}
    />
  );
}
