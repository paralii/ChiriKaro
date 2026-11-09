import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BrandLockup } from '@/components/atoms/BrandLockup';
import { PageHeading } from '@/components/molecules/PageHeading';
import { SideMark, sideLinkClass } from '@/components/molecules/NavItem';
import { PortalTopbar } from '@/components/organisms/PortalTopbar';
import { PortalTemplate } from '@/components/templates/PortalTemplate';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { loadClinic } from '@/features/clinic/store/clinicSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const items = [
  { path: '/clinic/dashboard', label: 'Overview' },
  { path: '/clinic/doctors', label: 'Doctor invitations' },
  { path: '/clinic/review-doctors', label: 'Doctor verification' },
  { path: '/clinic/staff', label: 'Staff invitations' },
];

export default function ClinicPortalLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user)!;
  const clinic = useAppSelector((state) => state.clinic.current);
  const { pathname } = useLocation();
  const section = pathname.split('/')[2] ?? 'dashboard';
  const title = section === 'profile' ? 'Clinic profile' : section === 'setup' ? 'Clinic setup' : section === 'doctors' ? 'Doctor invitations' : section === 'review-doctors' ? 'Doctor verification' : section === 'staff' ? 'Staff invitations' : 'Overview';
  const logout = useLogout();

  useEffect(() => { void dispatch(loadClinic()); }, [dispatch]);

  const approved = clinic?.status === 'APPROVED';
  const visibleItems = approved ? items : items.filter((item) => item.path === '/clinic/dashboard' || item.path === '/clinic/setup');
  if (approved && pathname === '/clinic/setup') return <Navigate to="/clinic/dashboard" replace />;
  if (!approved && clinic && !['/clinic/dashboard', '/clinic/setup', '/clinic/profile'].includes(pathname)) return <Navigate to="/clinic/dashboard" replace />;

  return (
    <PortalTemplate
      sidebar={(
        <aside className="sticky top-0 flex h-screen flex-col border-r border-[#e7e8ef] bg-white px-[15px] pt-[23px] pb-[15px] max-md:static max-md:h-auto max-md:border-r-0 max-md:border-b max-md:pt-3 max-md:pb-2.5">
          <BrandLockup className="px-[9px] max-md:px-[3px]" />
          <div className="mx-[9px] mt-[37px] mb-2.5 text-[9px] font-bold text-[#9295a2] max-md:hidden">CLINIC WORKSPACE</div>
          <div className="mx-[9px] truncate rounded-[7px] border border-[#e8e9ef] px-2 py-2.5 text-[11px] font-semibold max-md:hidden">{clinic?.name ?? `${user.name}'s clinic`}</div>
          <nav aria-label="Clinic navigation" className="mt-[25px] grid gap-[3px] max-md:mt-[11px] max-md:flex max-md:overflow-x-auto">
            {visibleItems.map((item) => (
              <NavLink key={item.path} to={item.path} className={({ isActive }) => sideLinkClass(isActive)}>
                {({ isActive }) => <><SideMark active={isActive} />{item.label}</>}
              </NavLink>
            ))}
          </nav>
          <div className="mt-auto max-md:hidden">
            <button className={sideLinkClass()} onClick={logout}><SideMark />Sign out</button>
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
