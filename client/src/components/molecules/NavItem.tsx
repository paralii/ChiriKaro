import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';

export const sideLinkClass = (active = false) =>
  cn('flex min-h-[37px] w-full cursor-pointer items-center gap-[11px] rounded-md border-0 bg-transparent px-2.5 text-left text-xs text-[#656a79] transition hover:bg-[#f4f6fc] hover:text-brand-deep max-md:min-h-[34px] max-md:w-auto max-md:shrink-0 max-md:px-[9px] max-md:text-[10px]',
    active && 'bg-[#edf2ff] font-semibold text-brand-deep');

export const SideMark = ({ active }: { active?: boolean }) => (
  <span className={cn('size-2 shrink-0 rounded-[2px] border-[1.5px] border-current opacity-70 max-md:hidden', active && 'border-brand bg-brand shadow-[inset_0_0_0_2px_#edf2ff]')} />
);

export function NavItem({ path, children, badge }: { path: string; children: ReactNode; badge?: number }) {
  return (
    <NavLink to={`/app/${path}`} className={({ isActive }) => sideLinkClass(isActive)}>
      {({ isActive }) => (<><SideMark active={isActive} />{children}
        {badge ? <span className="ml-auto grid h-[19px] min-w-[19px] place-items-center rounded-[10px] bg-[#fff0d9] text-[10px] text-[#8b430e]">{badge}</span> : null}</>)}
    </NavLink>
  );
}