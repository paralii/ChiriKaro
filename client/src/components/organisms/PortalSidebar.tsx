import { BrandLockup } from '@/components/atoms/BrandLockup';
import { NavItem, SideMark } from '@/components/molecules/NavItem';
import { sideLinkClass } from '@shared/utils/sideLinkClass';
import { roleLabels } from '@/shared/constants/roles';
import type { NavEntry } from '@/shared/constants/navigation';
import type { Role } from '@/features/auth/store/authSlice';

export function PortalSidebar({ role, workspaceName, items, pendingCount = 0, onLogout }: {
  role: Role; workspaceName?: string; items: NavEntry[]; pendingCount?: number; onLogout: () => void;
}) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-border bg-surface-elevated px-4 pt-6 pb-4 max-md:static max-md:h-auto max-md:border-r-0 max-md:border-b max-md:px-4 max-md:pt-3 max-md:pb-2.5">
      <BrandLockup className="px-2 max-md:px-1" />
      <div className="mx-2 mt-9 mb-3 text-xs font-semibold tracking-wide text-text-muted max-md:hidden">WORKSPACE</div>
      <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)_14px] items-center gap-2.5 rounded-md border border-border bg-surface-elevated px-2.5 py-3 max-md:hidden">
        <span className="grid size-9 place-items-center rounded-md bg-primary-soft text-sm font-bold text-primary-hover">{roleLabels[role][0]}</span>
        <div className="min-w-0"><strong className="block truncate text-sm font-semibold text-text-primary">{workspaceName ?? `${roleLabels[role]} portal`}</strong><small className="mt-1 block truncate text-xs text-text-muted">{roleLabels[role]} workspace</small></div>
        <span aria-hidden="true" className="text-center text-base text-text-muted">&#8964;</span>
      </div>
      <nav aria-label="Workspace navigation" className="mt-6 grid gap-1 max-md:mt-3 max-md:flex max-md:overflow-x-auto max-md:pb-1">
        {items.map((i) => <NavItem key={i.path} path={i.path} badge={i.path === 'pending' ? pendingCount : undefined}>{i.label}</NavItem>)}
      </nav>
      <div className="mt-auto max-md:hidden">
        {role !== 'SUPER_ADMIN' ? <div className="mx-1 mb-3 flex items-center gap-2.5 border-t border-border px-2 py-3">
          <span aria-hidden="true" className="grid size-7 place-items-center rounded-full border border-border text-sm text-primary-hover">?</span>
          <span><strong className="block text-xs font-semibold text-text-primary">Need a hand?</strong><small className="mt-1 block text-xs text-text-muted">Contact support</small></span>
        </div> : null}
        <button className={`${sideLinkClass()} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`} onClick={onLogout}><SideMark />Sign out</button>
      </div>
    </aside>
  );
}
