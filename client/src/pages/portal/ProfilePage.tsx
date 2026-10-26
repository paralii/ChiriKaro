import { Card } from '@/components/atoms/Card';
import { ProfileForm } from '@/components/organisms/ProfileForm';
import { ChangePasswordForm } from '@/components/organisms/ChangePasswordForm';
import { roleLabels } from '@/constants/roles';
import { useAppSelector } from '@/store/hooks';
import ClinicSetupPage from './clinic/ClinicSetupPage';

export default function ProfilePage() {
  const user = useAppSelector((s) => s.auth.user)!;
  if (user.role === 'clinic_admin') return <ClinicSetupPage />;
  return (
    <Card className="pb-5">
      <ProfileForm name={user.name} email={user.email} roleLabel={roleLabels[user.role]} />
      <ChangePasswordForm email={user.email} />
    </Card>
  );
}