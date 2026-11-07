import { DetailList } from '@/components/molecules/DetailList';
import { WelcomeBand } from '@/components/molecules/WelcomeBand';
import { roleLabels } from '@/shared/constants/roles';
import { useAppSelector } from '@/store/hooks';

export default function TeamAccessPage() {
  const user = useAppSelector((state) => state.auth.user)!;

  return (
    <>
      <WelcomeBand pill="ACCOUNT ACTIVE" title={`Welcome, ${user.name}.`} description={`Your ${roleLabels[user.role].toLowerCase()} account is ready.`} />
      <DetailList items={[
        ['Name', user.name],
        ['Email', user.email],
        ['Role', roleLabels[user.role]],
        ['Clinic', user.clinicId ?? 'Clinic workspace'],
      ]} />
    </>
  );
}
