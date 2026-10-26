import { BrandLockup } from '@/components/atoms/BrandLockup';
import { NavItem, SideMark, sideLinkClass } from '@/components/molecules/NavItem';
import { roleLabels } from '@/constants/roles';
import type { NavEntry } from '@/constants/navigation';
import type { Role } from '@/store/slices/authSlice';

export function PortalSidebar({ role, workspaceName, items, pendingCount = 0, onLogout }: {
  role: Role; workspaceName?: string; items: NavEntry[]; pendingCount?: number; onLogout: () => void;
}) {
  return (
    <aside className="sticky top-0 flex h-screen flex-col border-r border-[#e7e8ef] bg-white px-[15px] pt-[23px] pb-[15px] max-md:static max-md:h-auto max-md:border-r-0 max-md:border-b max-md:pt-3 max-md:pb-2.5">
      <BrandLockup className="px-[9px] max-md:px-[3px]" />
      <div className="mx-[9px] mt-[37px] mb-2.5 text-[9px] font-bold text-[#9295a2] max-md:hidden">WORKSPACE</div>
      <div className="grid min-w-0 grid-cols-[34px_minmax(0,1fr)_14px] items-center gap-[9px] rounded-[7px] border border-[#e8e9ef] px-2 py-2.5 max-md:hidden">
        <span className="grid size-8 place-items-center rounded-[8px_8px_8px_3px] bg-[#e8efff] text-[13px] font-bold text-[#214994]">{roleLabels[role][0]}</span>
        <div className="min-w-0"><strong className="block truncate text-[11px]">{workspaceName ?? `${roleLabels[role]} portal`}</strong><small className="mt-1 block truncate text-[10px] text-[#858997]">{roleLabels[role]} workspace</small></div>
        <span className="text-center text-[15px] text-[#848896]">&#8964;</span>
      </div>
      <nav aria-label="Workspace navigation" className="mt-[25px] grid gap-[3px] max-md:mt-[11px] max-md:flex max-md:overflow-x-auto">
        {items.map((i) => <NavItem key={i.path} path={i.path} badge={i.path === 'pending' ? pendingCount : undefined}>{i.label}</NavItem>)}
      </nav>
      <div className="mt-auto max-md:hidden">
        <div className="mx-0.5 mb-[13px] flex items-center gap-2.5 border-t border-[#ececf1] px-2 py-[11px]">
          <span className="grid size-[25px] place-items-center rounded-full border border-[#d9dce6] text-xs text-brand-deep">?</span>
          <span><strong className="block text-[10px]">Need a hand?</strong><small className="mt-[3px] block text-[9px] text-[#888b97]">Contact support</small></span>
        </div>
        <button className={sideLinkClass()} onClick={onLogout}><SideMark />Sign out</button>
      </div>
    </aside>
  );
}