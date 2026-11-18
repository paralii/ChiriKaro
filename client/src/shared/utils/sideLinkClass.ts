import { cn } from '@shared/lib/cn';

export const sideLinkClass = (active = false) =>
  cn('flex min-h-[37px] w-full cursor-pointer items-center gap-[11px] rounded-md border-0 bg-transparent px-2.5 text-left text-xs text-[#656a79] transition hover:bg-[#f4f6fc] hover:text-brand-deep max-md:min-h-[34px] max-md:w-auto max-md:shrink-0 max-md:px-[9px] max-md:text-[10px]',
    active && 'bg-[#edf2ff] font-semibold text-brand-deep');
