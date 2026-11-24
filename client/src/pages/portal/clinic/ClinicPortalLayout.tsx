import { useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BrandLockup } from '@/components/atoms/BrandLockup';
import { PageHeading } from '@/components/molecules/PageHeading';
import { SideMark } from '@/components/molecules/NavItem';
import { sideLinkClass } from '@shared/utils/sideLinkClass';
import { PortalTopbar } from '@/components/organisms/PortalTopbar';
import { PortalTemplate } from '@/components/templates/PortalTemplate';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { loadClinic } from '@/features/clinic/store/clinicSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const items = [
  { path: '/clinic/dashboard', label: 'Overview' },
  { path: '/clinic/setup', label: 'Services and schedules' },
  { path: '/clinic/doctors', label: 'Doctor invitations' },
  { path: '/clinic/review-doctors', label: 'Doctor verification' },
  { path: '/clinic/staff', label: 'Staff invitations' },
  { path: '/clinic/queue', label: 'Today’s queue' },
  { path: '/clinic/treatment-plans', label: 'Guest treatment plans' },
];

export default function ClinicPortalLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user)!;
  const clinic = useAppSelector((state) => state.clinic.current);
  const { pathname } = useLocation();
  const section = pathname.split('/')[2] ?? 'dashboard';
  const title = section === 'profile' ? 'Clinic profile' : section === 'setup' ? 'Clinic setup' : section === 'doctors' ? 'Doctor invitations' : section === 'review-doctors' ? 'Doctor verification' : section === 'staff' ? 'Staff invitations' : section === 'queue' ? 'Today’s queue' : section === 'treatment-plans' ? 'Guest treatment plans' : 'Overview';
  const logout = useLogout();

  useEffect(() => { void dispatch(loadClinic()); }, [dispatch]);

  const approved = clinic?.status === 'APPROVED';
  const visibleItems = approved ? items : items.filter((item) => item.path === '/clinic/dashboard' || item.path === '/clinic/setup');
  if (!approved && clinic && !['/clinic/dashboard', '/clinic/setup', '/clinic/profile'].includes(pathname)) return <Navigate to="/clinic/dashboard" replace />;

  return (
    <PortalTemplate
      sidebar={(
        <aside className="sticky top-0 flex h-screen flex-col border-r border-border bg-surface-elevated px-4 pt-6 pb-4 max-md:static max-md:h-auto max-md:border-r-0 max-md:border-b max-md:pt-3 max-md:pb-2.5">
          <BrandLockup className="px-2 max-md:px-1" />
          <div className="mx-2 mt-9 mb-3 text-xs font-semibold tracking-wide text-text-muted max-md:hidden">CLINIC WORKSPACE</div>
          <div className="mx-2 truncate rounded-md border border-border bg-surface-elevated px-2.5 py-3 text-sm font-semibold text-text-primary max-md:hidden">{clinic?.name ?? `${user.name}'s clinic`}</div>
          <nav aria-label="Clinic navigation" className="mt-6 grid gap-1 max-md:mt-3 max-md:flex max-md:overflow-x-auto max-md:pb-1">
            {visibleItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => `${sideLinkClass(isActive)} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`}>
                {({ isActive }) => <><SideMark active={isActive} />{item.label}</>}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto max-md:hidden">
            <button className={`${sideLinkClass()} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus`} onClick={logout}><SideMark />Sign out</button>
          </div>
        </aside>
      )}
      topbar={<PortalTopbar title={title} userName={user.name} profileTo="/clinic/profile" />}
    >
      <PageHeading eyebrow="Clinic workspace" title={title} />
      <Outlet />
    </PortalTemplate>
  );
}
