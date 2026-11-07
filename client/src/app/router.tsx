import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireClinicAdmin, RequireSuperAdmin } from '@/app/guards';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import SuperAdminLoginPage from '@/pages/auth/SuperAdminLoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import AdminPortalLayout from '@/pages/portal/admin/AdminPortalLayout';
import AdminDashboardPage from '@/pages/portal/admin/AdminDashboardPage';
import AdminClinicsPage from '@/pages/portal/admin/AdminClinicsPage';
import ClinicPortalLayout from '@/pages/portal/clinic/ClinicPortalLayout';
import ClinicDashboardPage from '@/pages/portal/clinic/ClinicDashboardPage';
import ClinicProfilePage from '@/pages/portal/clinic/ClinicProfilePage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/superadmin" element={<SuperAdminLoginPage />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/register/:role" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<RequireClinicAdmin />}>
        <Route path="/clinic" element={<ClinicPortalLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClinicDashboardPage />} />
          <Route path="profile" element={<ClinicProfilePage />} />
        </Route>
      </Route>

      <Route element={<RequireSuperAdmin />}>
        <Route path="/app" element={<AdminPortalLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="clinics" element={<AdminClinicsPage />} />
          <Route path="pending" element={<AdminClinicsPage pendingOnly />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
