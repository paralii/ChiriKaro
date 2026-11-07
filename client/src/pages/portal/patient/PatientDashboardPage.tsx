import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { DetailList } from '@/components/molecules/DetailList';
import { MetricCard, MetricGrid } from '@/components/molecules/MetricCard';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { WelcomeBand } from '@/components/molecules/WelcomeBand';
import { roleDashboardService } from '@/features/dashboard/services/roleDashboardService';
import { useAction } from '@/shared/hooks/useAction';
import type { RoleDashboard } from '@/shared/types';
import { useAppSelector } from '@/store/hooks';

export default function PatientDashboardPage() {
  const signedInUser = useAppSelector((state) => state.auth.user)!;
  const [dashboard, setDashboard] = useState<RoleDashboard | null>(null);
  const { busy, error, run } = useAction();

  useEffect(() => {
    void run(async () => {
      const result = await roleDashboardService.getDashboard('PATIENT');
      setDashboard(result);
      return result;
    }, { fallback: 'Could not load your patient dashboard.' });
  }, [run]);

  const user = dashboard?.user ?? signedInUser;
  const clinic = dashboard?.clinic;
  return (
    <>
      <Notices error={error} />
      <WelcomeBand variant="patient" eyebrow="YOUR CARE, IN ONE PLACE" title={`Good to see you, ${user.name.split(' ')[0]}.`} description="Your patient account and clinic information are available here."
        action={<Link to="/patient/profile"><Button variant="secondary" tabIndex={-1}>Edit profile</Button></Link>} />
      <MetricGrid cols={2}>
        <MetricCard label="Care profile" value={busy ? 'Loading' : 'Ready'} note="Your patient account is active" to="/patient/profile" linkText="View profile" />
        <MetricCard label="Clinic association" value={clinic?.name ?? (busy ? 'Loading' : 'Not linked')} note={clinic ? `Clinic status: ${clinic.status}` : 'No clinic is linked to this account'} />
      </MetricGrid>
      <Card>
        <SectionHeading title="Account details" description="Information associated with your patient account" />
        <DetailList items={[
          ['Name', user.name],
          ['Email', signedInUser.email],
          ['Role', 'Patient'],
          ['Clinic', clinic?.name ?? 'Not linked'],
        ]} />
      </Card>
    </>
  );
}
