import { useAppSelector } from '@/store/hooks';
import AdminClinicsPage from './admin/AdminClinicsPage';
import PatientClinicsPage from './patient/PatientClinicsPage';

export default function ClinicsPage() {
  const role = useAppSelector((s) => s.auth.user?.role);
  return role === 'super_admin' ? <AdminClinicsPage /> : <PatientClinicsPage />;
}