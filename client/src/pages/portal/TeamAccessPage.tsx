import { useEffect, useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { DetailList } from '@/components/molecules/DetailList';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { WelcomeBand } from '@/components/molecules/WelcomeBand';
import { roleDashboardService } from '@/features/dashboard/services/roleDashboardService';
import { useAction } from '@/shared/hooks/useAction';
import { roleLabels } from '@/shared/constants/roles';
import type { RoleDashboard } from '@/shared/types';
import { useAppSelector } from '@/store/hooks';

export default function TeamAccessPage() {
  const user = useAppSelector((state) => state.auth.user)!;
  const [dashboard, setDashboard] = useState<RoleDashboard | null>(null);
  const { busy, error, run } = useAction();

  useEffect(() => {
    const role = user.role === 'DOCTOR' ? 'DOCTOR' : 'STAFF';
    void run(async () => {
      const result = await roleDashboardService.getDashboard(role);
      setDashboard(result);
      return result;
    }, { fallback: 'Could not load your workspace.' });
  }, [run, user.role]);

  const clinic = dashboard?.clinic;

  return (
    <>
      <Notices error={error} />
      <WelcomeBand pill="ACCOUNT ACTIVE" title={`Welcome, ${dashboard?.user.name ?? user.name}.`} description={`Your ${roleLabels[user.role].toLowerCase()} workspace is ready.`} />
      <Card>
        <SectionHeading title="Workspace details" description={busy ? 'Loading your clinic association...' : 'Information associated with your account'} />
        <DetailList items={[
          ['Name', dashboard?.user.name ?? user.name],
          ['Email', user.email],
          ['Role', roleLabels[user.role]],
          ['Clinic', clinic?.name ?? (busy ? 'Loading...' : 'Not linked')],
          ['Clinic status', clinic?.status ?? '—'],
        ]} />
      </Card>
    </>
  );
}
