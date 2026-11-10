import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BrandLockup } from '@/components/atoms/BrandLockup';
import { PageHeading } from '@/components/molecules/PageHeading';
import { SideMark, sideLinkClass } from '@/components/molecules/NavItem';
import { PortalTopbar } from '@/components/organisms/PortalTopbar';
import { PortalTemplate } from '@/components/templates/PortalTemplate';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAppSelector } from '@/store/hooks';

const items = [
  { path: '/doctor/dashboard', label: 'Onboarding' },
  // { path: '/doctor/availability', label: 'Availability' },
  { path: '/doctor/workspace', label: 'Workspace details' },
];

const titles: Record<string, string> = {
  dashboard: 'Doctor onboarding',
  // availability: 'Availability',
  workspace: 'Workspace details',
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
        <aside className="sticky top-0 flex h-screen flex-col border-r border-[#e7e8ef] bg-white px-[15px] pt-[23px] pb-[15px] max-md:static max-md:h-auto max-md:border-r-0 max-md:border-b max-md:pt-3 max-md:pb-2.5">
          <BrandLockup className="px-[9px] max-md:px-[3px]" />
          <div className="mx-[9px] mt-[37px] mb-2.5 text-[9px] font-bold text-[#9295a2] max-md:hidden">DOCTOR WORKSPACE</div>
          <div className="mx-[9px] truncate rounded-[7px] border border-[#e8e9ef] px-2 py-2.5 text-[11px] font-semibold max-md:hidden">{user.name}</div>
          <nav aria-label="Doctor navigation" className="mt-[25px] grid gap-[3px] max-md:mt-[11px] max-md:flex max-md:overflow-x-auto">
            {items.map((item) => <NavLink key={item.path} to={item.path} className={({ isActive }) => sideLinkClass(isActive)}>{({ isActive }) => <><SideMark active={isActive} />{item.label}</>}</NavLink>)}
          </nav>
          <div className="mt-auto max-md:hidden">
            <button className={sideLinkClass()} onClick={logout}><SideMark />Sign out</button>
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
