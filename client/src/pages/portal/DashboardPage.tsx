import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { DetailList } from '@/components/molecules/DetailList';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { WelcomeBand } from '@/components/molecules/WelcomeBand';
import { roleLabels } from '@/constants/roles';
import { useAppSelector } from '@/store/hooks';
import AdminDashboardPage from './admin/AdminDashboardPage';
import ClinicDashboardPage from './clinic/ClinicDashboardPage';
import DoctorOnboardingPage from './doctor/DoctorOnboardingPage';
import PatientDashboardPage from './patient/PatientDashboardPage';

export default function DashboardPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  switch (user.role) {
    case 'super_admin': return <AdminDashboardPage />;
    case 'clinic_admin': return <ClinicDashboardPage />;
    case 'doctor': return <DoctorOnboardingPage />;
    case 'patient': return <PatientDashboardPage />;
    default:
      return (
        <>
          <WelcomeBand pill="ACCOUNT ACTIVE" title={`Welcome, ${user.name}.`} description={`Your ${roleLabels[user.role].toLowerCase()} workspace is ready.`}
            action={<Link to="/app/profile"><Button variant="secondary" tabIndex={-1}>View profile</Button></Link>} />
          <Card>
            <SectionHeading title="Workspace access" description={`You are signed in with the ${roleLabels[user.role].toLowerCase()} role.`} />
            <DetailList items={[['Name', user.name], ['Email', user.email], ['Role', roleLabels[user.role]]]} />
          </Card>
        </>
      );
  }
}