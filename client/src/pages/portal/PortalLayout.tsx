import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PortalTemplate } from '@/components/templates/PortalTemplate';
import { PortalSidebar } from '@/components/organisms/PortalSidebar';
import { PortalTopbar } from '@/components/organisms/PortalTopbar';
import { PageHeading } from '@/components/molecules/PageHeading';
import { getPageTitle, navItems } from '@/constants/navigation';
import { roleLabels } from '@/constants/roles';
import { useLogout } from '@/hooks/useLogout';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loadAdminClinics } from '@/store/slices/adminClinicsSlice';
import { loadClinic } from '@/store/slices/clinicSlice';

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
    if (role === 'super_admin') void dispatch(loadAdminClinics());
    if (role === 'clinic_admin') void dispatch(loadClinic());
  }, [dispatch, role]);

  return (
    <PortalTemplate
      sidebar={<PortalSidebar role={role} workspaceName={role === 'clinic_admin' ? clinic?.name : undefined} items={navItems[role]} pendingCount={role === 'super_admin' ? pending : 0} onLogout={logout} />}
      topbar={<PortalTopbar title={title} userName={user.name} />}
    >
      <PageHeading eyebrow={`${roleLabels[role]} workspace`} title={title} chip={role === 'clinic_admin' && (section === 'doctors' || section === 'staff') ? 'INVITATIONS' : undefined} />
      <Outlet />
    </PortalTemplate>
  );
}