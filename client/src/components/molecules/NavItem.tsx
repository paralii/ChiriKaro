import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@shared/lib/cn';
import { sideLinkClass } from '@shared/utils/sideLinkClass';

export const SideMark = ({ active }: { active?: boolean }) => (
  <span aria-hidden="true" className={cn('size-2 shrink-0 rounded-sm border-[1.5px] border-current opacity-70 max-md:hidden', active && 'border-brand bg-brand shadow-[inset_0_0_0_2px_#edf2ff]')} />
);

export function NavItem({ path, children, badge }: { path: string; children: ReactNode; badge?: number }) {
  return (
    <NavLink to={`/app/${path}`} className={({ isActive }) => cn(sideLinkClass(isActive), 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus')}>
      {({ isActive }) => (<><SideMark active={isActive} />{children}
        {badge ? <span className="ml-auto grid h-[19px] min-w-[19px] place-items-center rounded-[10px] bg-[#fff0d9] text-[10px] text-[#8b430e]">{badge}</span> : null}</>)}
    </NavLink>
  );
}
