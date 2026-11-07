import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { DetailList } from '@/components/molecules/DetailList';
import { MetricCard, MetricGrid } from '@/components/molecules/MetricCard';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { WelcomeBand } from '@/components/molecules/WelcomeBand';
import { useAppSelector } from '@/store/hooks';

export default function ClinicDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  const { current: clinic, dashboard, busy, error } = useAppSelector((s) => s.clinic);
  return (
    <>
      <Notices error={error} />
      <WelcomeBand pill={clinic?.status ?? (busy ? 'LOADING' : 'CLINIC')} title={clinic?.name ?? 'Your clinic workspace'} description="Keep your clinic information and team access up to date."
        action={<Link to="/clinic/profile"><Button variant="secondary" tabIndex={-1}>Edit clinic profile</Button></Link>} />
      <MetricGrid cols={3}>
        <MetricCard word label="Clinic status" value={clinic?.status ?? (busy ? 'Loading' : 'Unavailable')} note="Approval and account access" />
        <MetricCard label="Doctors" value={dashboard?.totalDoctors ?? (busy ? '…' : 0)} note="Doctors associated with your clinic" />
        <MetricCard label="Staff" value={dashboard?.totalStaff ?? (busy ? '…' : 0)} note="Staff associated with your clinic" />
      </MetricGrid>
      <Card>
        <SectionHeading title="Clinic details" description="Information associated with your account" />
        <DetailList items={[['Clinic', clinic?.name ?? (busy ? 'Loading...' : 'Not available')], ['Owner', clinic?.ownerName ?? user.name], ['Contact', clinic?.contactEmail ?? user.email], ['Address', clinic?.address ?? 'Not provided']]} />
      </Card>
    </>
  );
}
