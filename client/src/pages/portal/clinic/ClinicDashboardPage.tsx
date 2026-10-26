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
  const { current: clinic, error } = useAppSelector((s) => s.clinic);
  return (
    <>
      <Notices error={error} />
      <WelcomeBand pill={clinic?.status ?? 'LOADING'} title={clinic?.name ?? 'Your clinic workspace'} description="Keep your clinic information and team access up to date."
        action={<Link to="/app/profile"><Button variant="secondary" tabIndex={-1}>Edit clinic profile</Button></Link>} />
      <MetricGrid cols={3}>
        <MetricCard word label="Clinic status" value={clinic?.status ?? 'Loading'} note="Approval and account access" />
        <MetricCard label="Doctors" value="Invite" note="Bring clinicians into your workspace" to="/app/doctors" linkText="Manage invitations" />
        <MetricCard label="Staff" value="Invite" note="Give your team the right access" to="/app/staff" linkText="Manage invitations" />
      </MetricGrid>
      <Card>
        <SectionHeading title="Clinic details" description="Information associated with your account" />
        <DetailList items={[['Clinic', clinic?.name ?? 'Loading...'], ['Owner', clinic?.ownerName ?? user.name], ['Contact', clinic?.contactEmail ?? user.email], ['Address', clinic?.address ?? 'Not provided']]} />
      </Card>
    </>
  );
}