import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireClinicAdmin, RequireDoctor, RequirePatient, RequireStaff, RequireSuperAdmin } from '@/app/guards';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import GoogleAuthCallbackPage from '@/pages/auth/GoogleAuthCallbackPage';
import SuperAdminLoginPage from '@/pages/auth/SuperAdminLoginPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';
import AdminPortalLayout from '@/pages/portal/admin/AdminPortalLayout';
import AdminDashboardPage from '@/pages/portal/admin/AdminDashboardPage';
import AdminClinicsPage from '@/pages/portal/admin/AdminClinicsPage';
import AdminPatientsPage from '@/pages/portal/admin/AdminPatientsPage';
import AdminDoctorsPage from '@/pages/portal/admin/AdminDoctorsPage';
import ClinicPortalLayout from '@/pages/portal/clinic/ClinicPortalLayout';
import ClinicDashboardPage from '@/pages/portal/clinic/ClinicDashboardPage';
import ClinicProfilePage from '@/pages/portal/clinic/ClinicProfilePage';
import ClinicSetupPage from '@/pages/portal/clinic/ClinicSetupPage';
import ClinicDoctorReviewPage from '@/pages/portal/clinic/ClinicDoctorReviewPage';
import ClinicInvitationsPage from '@/pages/portal/clinic/ClinicInvitationsPage';
import AcceptInvitationPage from '@/pages/AcceptInvitationPage';
import TeamAccessPage from '@/pages/portal/TeamAccessPage';
import DoctorOnboardingPage from '@/pages/portal/doctor/DoctorOnboardingPage';
import DoctorAvailabilityPage from '@/pages/portal/doctor/DoctorAvailabilityPage';
import DoctorPortalLayout from '@/pages/portal/doctor/DoctorPortalLayout';
import PatientPortalLayout from '@/pages/portal/patient/PatientPortalLayout';
import PatientDashboardPage from '@/pages/portal/patient/PatientDashboardPage';
import PatientProfilePage from '@/pages/portal/patient/PatientProfilePage';
import PatientClinicsPage from '@/pages/portal/patient/PatientClinicsPage';
import PatientAppointmentsPage from '@/pages/portal/patient/PatientAppointmentsPage';
import PatientAppointmentDetailsPage from '@/pages/portal/patient/PatientAppointmentDetailsPage';
import PatientQueuePage from '@/pages/portal/patient/PatientQueuePage';
import PatientClinicProfilePage from '@/pages/portal/patient/PatientClinicProfilePage';
import PatientDoctorProfilePage from '@/pages/portal/patient/PatientDoctorProfilePage';
import PatientPrescriptionsPage from '@/pages/portal/patient/PatientPrescriptionsPage';
import ClinicQueuePage from '@/pages/portal/clinic/ClinicQueuePage';
import DoctorConsultationPage from '@/pages/portal/doctor/DoctorConsultationPage';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/superadmin" element={<SuperAdminLoginPage />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/register/:role" element={<RegisterPage />} />
      <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/accept-invitation" element={<AcceptInvitationPage />} />

      <Route element={<RequirePatient />}>
        <Route path="/patient" element={<PatientPortalLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboardPage />} />
          <Route path="clinics" element={<PatientClinicsPage />} />
          <Route path="clinics/:listingId" element={<PatientClinicProfilePage />} />
          <Route path="doctors/:listingId" element={<PatientDoctorProfilePage />} />
          <Route path="appointments" element={<PatientAppointmentsPage />} />
          <Route path="appointments/:appointmentId" element={<PatientAppointmentDetailsPage />} />
          <Route path="prescriptions" element={<PatientPrescriptionsPage />} />
          <Route path="queue" element={<PatientQueuePage />} />
          <Route path="profile" element={<PatientProfilePage />} />
        </Route>
      </Route>

      <Route element={<RequireDoctor />}>
        <Route path="/doctor" element={<DoctorPortalLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DoctorOnboardingPage />} />
          <Route path="availability" element={<DoctorAvailabilityPage />} />
          <Route path="workspace" element={<TeamAccessPage />} />
          <Route path="queue" element={<ClinicQueuePage canRegister={false} />} />
          <Route path="consultations/new" element={<DoctorConsultationPage />} />
          <Route path="consultations/:consultationId" element={<DoctorConsultationPage />} />
        </Route>
      </Route>
      <Route element={<RequireStaff />}>
        <Route path="/staff/dashboard" element={<TeamAccessPage />} />
        <Route path="/staff/queue" element={<ClinicQueuePage />} />
      </Route>

      <Route element={<RequireClinicAdmin />}>
        <Route path="/clinic" element={<ClinicPortalLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClinicDashboardPage />} />
          <Route path="profile" element={<ClinicProfilePage />} />
          <Route path="setup" element={<ClinicSetupPage />} />
          <Route path="doctors" element={<ClinicInvitationsPage invitee="doctor" />} />
          <Route path="review-doctors" element={<ClinicDoctorReviewPage />} />
          <Route path="staff" element={<ClinicInvitationsPage invitee="staff" />} />
          <Route path="queue" element={<ClinicQueuePage />} />
        </Route>
      </Route>

      <Route element={<RequireSuperAdmin />}>
        <Route path="/app" element={<AdminPortalLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="clinics" element={<AdminClinicsPage />} />
          <Route path="patients" element={<AdminPatientsPage />} />
          <Route path="doctors" element={<AdminDoctorsPage />} />
          <Route path="pending" element={<AdminClinicsPage pendingOnly />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
