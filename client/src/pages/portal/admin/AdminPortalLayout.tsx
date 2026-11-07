import { Outlet, useLocation } from 'react-router-dom';
import { PageHeading } from '@/components/molecules/PageHeading';
import { PortalSidebar } from '@/components/organisms/PortalSidebar';
import { PortalTopbar } from '@/components/organisms/PortalTopbar';
import { PortalTemplate } from '@/components/templates/PortalTemplate';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAppSelector } from '@/store/hooks';

const items = [
  { path: 'dashboard', label: 'Overview' },
  { path: 'clinics', label: 'All clinics' },
  { path: 'pending', label: 'Pending review' },
];

const titles: Record<string, string> = {
  dashboard: 'Overview',
  clinics: 'Clinic directory',
  pending: 'Pending clinics',
};

export default function AdminPortalLayout() {
  const user = useAppSelector((state) => state.auth.user)!;
  const pending = useAppSelector((state) => state.adminClinics.summary.pending);
  const { pathname } = useLocation();
  const section = pathname.split('/')[2] ?? 'dashboard';
  const title = titles[section] ?? 'Overview';
  const logout = useLogout();

  return (
    <PortalTemplate
      sidebar={<PortalSidebar role="SUPER_ADMIN" items={items} pendingCount={pending} onLogout={logout} />}
      topbar={<PortalTopbar title={title} userName={user.name} />}
    >
      <PageHeading eyebrow="Super admin workspace" title={title} />
      <Outlet />
    </PortalTemplate>
  );
}
