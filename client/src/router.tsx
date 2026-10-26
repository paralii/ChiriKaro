import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import SuperAdminLoginPage from '@/pages/auth/SuperAdminLoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import AcceptInvitationPage from '@/pages/auth/AcceptInvitationPage';
import PortalLayout from '@/pages/portal/PortalLayout';
import DashboardPage from '@/pages/portal/DashboardPage';
import ProfilePage from '@/pages/portal/ProfilePage';
import ClinicsPage from '@/pages/portal/ClinicsPage';
import AdminClinicsPage from '@/pages/portal/admin/AdminClinicsPage';
import ClinicInvitationsPage from '@/pages/portal/clinic/ClinicInvitationsPage';
import ClinicDoctorReviewPage from '@/pages/portal/clinic/ClinicDoctorReviewPage';
import { RequireAuth, RequireRole } from '@/routes/guards';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Navigate to="/login/patient" replace />} />
      <Route path="/superadmin" element={<SuperAdminLoginPage />} />
      <Route path="/login/super-admin" element={<Navigate to="/superadmin" replace />} />
      <Route path="/register/doctor" element={<Navigate to="/login/doctor" replace />} />
      <Route path="/register/staff" element={<Navigate to="/login/staff" replace />} />
      <Route path="/register/super-admin" element={<Navigate to="/superadmin" replace />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/register/:role" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ForgotPasswordPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

      <Route path="/app" element={<RequireAuth />}>
        <Route element={<PortalLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route element={<RequireRole roles={['patient', 'clinic_admin', 'staff']} />}>
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<ProfilePage />} />
          </Route>

          <Route element={<RequireRole roles={['patient', 'super_admin']} />}>
            <Route path="clinics" element={<ClinicsPage />} />
          </Route>

          <Route element={<RequireRole roles={['super_admin']} />}>
            <Route path="pending" element={<AdminClinicsPage pendingOnly />} />
          </Route>

          <Route element={<RequireRole roles={['clinic_admin']} />}>
            <Route path="doctors" element={<ClinicInvitationsPage invitee="doctor" />} />
            <Route path="staff" element={<ClinicInvitationsPage invitee="staff" />} />
            <Route path="review-doctors" element={<ClinicDoctorReviewPage />} />
          </Route>

          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}