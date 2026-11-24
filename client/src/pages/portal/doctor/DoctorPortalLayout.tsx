import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BrandLockup } from '@/components/atoms/BrandLockup';
import { PageHeading } from '@/components/molecules/PageHeading';
import { SideMark } from '@/components/molecules/NavItem';
import { sideLinkClass } from '@shared/utils/sideLinkClass';
import { PortalTopbar } from '@/components/organisms/PortalTopbar';
import { PortalTemplate } from '@/components/templates/PortalTemplate';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAppSelector } from '@/store/hooks';

const items = [
  { path: '/doctor/dashboard', label: 'Onboarding' },
  { path: '/doctor/availability', label: 'Availability and slots' },
  { path: '/doctor/workspace', label: 'Workspace details' },
  { path: '/doctor/queue', label: 'Clinic queue' },
  { path: '/doctor/transactions', label: 'Transactions' },
];

const titles: Record<string, string> = {
  dashboard: 'Doctor onboarding',
  availability: 'Availability and slots',
  workspace: 'Workspace details',
  queue: 'Clinic queue',
  consultations: 'Dental consultation',
  transactions: 'Transactions',
};

export default function DoctorPortalLayout() {
  const user = useAppSelector((state) => state.auth.user)!;
  const { pathname } = useLocation();
  const section = pathname.split('/')[2] ?? 'dashboard';
  const title = titles[section] ?? titles.dashboard;
  const logout = useLogout();

  return (
    <PortalTemplate
      sidebar={(
        <aside className="sticky top-0 flex h-screen flex-col border-r border-border bg-surface-elevated px-4 pt-6 pb-4 max-md:static max-md:h-auto max-md:border-r-0 max-md:border-b max-md:pt-3 max-md:pb-2.5">
          <BrandLockup className="px-2 max-md:px-1" />
          <div className="mx-2 mt-9 mb-3 text-xs font-semibold tracking-wide text-text-muted max-md:hidden">DOCTOR WORKSPACE</div>
          <div className="mx-2 truncate rounded-md border border-border bg-surface-elevated px-2.5 py-3 text-sm font-semibold text-text-primary max-md:hidden">{user.name}</div>
          <nav aria-label="Doctor navigation" className="mt-6 grid gap-1 max-md:mt-3 max-md:flex max-md:overflow-x-auto max-md:pb-1">
            {items.map((item) => <NavLink key={item.path} to={item.path} className={({ isActive }) => `${sideLinkClass(isActive)} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}>{({ isActive }) => <><SideMark active={isActive} />{item.label}</>}</NavLink>)}
          </nav>
          <div className="mt-auto max-md:hidden">
            <button className={`${sideLinkClass()} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`} onClick={logout}><SideMark />Sign out</button>
          </div>
        </aside>
      )}
      topbar={<PortalTopbar title={title} userName={user.name} profileTo="/doctor/workspace" />}
    >
      <PageHeading eyebrow="Doctor workspace" title={title} />
      <Outlet />
    </PortalTemplate>
  );
}
