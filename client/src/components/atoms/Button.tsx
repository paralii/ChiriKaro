import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const variants = {
  primary: 'border-transparent bg-brand text-white hover:bg-brand-deep',
  secondary: 'border-[#b7c9ff] bg-white text-brand-deep hover:bg-brand-soft',
  ghost: 'border-[#dce2f1] bg-white font-semibold text-brand-deep hover:bg-brand-soft',
};
const sizes = {
  md: 'min-h-[46px] gap-3.5 rounded-ui px-[18px] text-sm',
  sm: 'min-h-[38px] gap-3.5 rounded-ui px-3.5 text-[13px]',
  xs: 'gap-1 rounded-[4px] px-[7px] py-1.5 text-[9px]',
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants; size?: keyof typeof sizes };

export function Button({ variant = 'primary', size = 'md', className, ...props }: Props) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center border font-semibold transition hover:-translate-y-px disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60',
        variants[variant], sizes[size], className,
      )}
      {...props}
    />
  );
}