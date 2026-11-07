import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PortalTemplate } from '@/components/templates/PortalTemplate';
import { PortalSidebar } from '@/components/organisms/PortalSidebar';
import { PortalTopbar } from '@/components/organisms/PortalTopbar';
import { PageHeading } from '@/components/molecules/PageHeading';
import { getPageTitle, navItems } from '@/shared/constants/navigation';
import { roleLabels } from '@/shared/constants/roles';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadAdminClinics } from '@/features/admin/store/adminClinicsSlice';
import { loadClinic } from '@/features/clinic/store/clinicSlice';

export default function PortalLayout() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user)!;
  const pending = useAppSelector((s) => s.adminClinics.summary.pending);
  const clinic = useAppSelector((s) => s.clinic.current);
  const logout = useLogout();
  const { pathname } = useLocation();
  const section = pathname.split('/')[2] ?? 'dashboard';
  const role = user.role;
  const title = getPageTitle(role, section);

  useEffect(() => {
    if (role === 'SUPER_ADMIN') void dispatch(loadAdminClinics(1));
    if (role === 'CLINIC_ADMIN') void dispatch(loadClinic());
  }, [dispatch, role]);

  return (
    <PortalTemplate
      sidebar={<PortalSidebar role={role} workspaceName={role === 'CLINIC_ADMIN' ? clinic?.name : undefined} items={navItems[role]} pendingCount={role === 'SUPER_ADMIN' ? pending : 0} onLogout={logout} />}
      topbar={<PortalTopbar title={title} userName={user.name} />}
    >
      <PageHeading eyebrow={`${roleLabels[role]} workspace`} title={title} chip={role === 'CLINIC_ADMIN' && (section === 'doctors' || section === 'staff') ? 'INVITATIONS' : undefined} />
      <Outlet />
    </PortalTemplate>
  );
}
