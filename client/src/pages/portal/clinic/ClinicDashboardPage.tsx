import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { DetailList } from '@/components/molecules/DetailList';
import { MetricCard, MetricGrid } from '@/components/molecules/MetricCard';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { WelcomeBand } from '@/components/molecules/WelcomeBand';
import { Notice } from '@/components/atoms/Notice';
import { useAppSelector } from '@/store/hooks';

export default function ClinicDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  const { current: clinic, dashboard, busy, error } = useAppSelector((s) => s.clinic);
  const pending = clinic?.status !== 'APPROVED';
  return (
    <>
      <Notices error={error} />
      {pending && clinic ? <Notice tone="warning" className="mb-[18px]">
        <strong>{clinic.setupStatus === 'PENDING_VERIFICATION' ? 'Your clinic is awaiting review' : clinic.setupStatus === 'REJECTED' ? 'Clinic setup needs changes' : 'Clinic setup is incomplete'}</strong>
        <p className="mb-0">{clinic.setupStatus === 'PENDING_VERIFICATION' ? 'Your submitted details and documents are waiting for a super admin to review. Clinic access will be activated after approval.' : clinic.setupStatus === 'REJECTED' ? 'Update the requested clinic information and submit it again. A super admin must approve the updated details before activation.' : 'Complete your clinic details and upload verification documents, then submit them for super admin review.'}</p>
        {clinic.setupStatus !== 'PENDING_VERIFICATION' ? <Link className="mt-2 inline-block font-semibold underline" to="/clinic/setup">{clinic.setupStatus === 'REJECTED' ? 'Update clinic setup' : 'Continue clinic setup'}</Link> : null}
      </Notice> : null}
      <WelcomeBand pill={clinic?.status ?? (busy ? 'LOADING' : 'CLINIC')} title={clinic?.name ?? 'Your clinic workspace'} description="Keep your clinic information and team access up to date."
        action={<Link to="/clinic/profile"><Button variant="secondary" tabIndex={-1}>Edit clinic profile</Button></Link>} />
      {clinic?.status === 'APPROVED' ? <MetricGrid cols={3}>
        <MetricCard word label="Clinic status" value={clinic?.status ?? (busy ? 'Loading' : 'Unavailable')} note="Approval and account access" />
        <MetricCard label="Doctors" value={dashboard?.totalDoctors ?? (busy ? '…' : 0)} note="Doctors associated with your clinic" />
        <MetricCard label="Staff" value={dashboard?.totalStaff ?? (busy ? '…' : 0)} note="Staff associated with your clinic" />
      </MetricGrid> : null}
      <Card>
        <SectionHeading title="Clinic details" description="Information associated with your account" />
        <DetailList items={[['Clinic', clinic?.name ?? (busy ? 'Loading...' : 'Not available')], ['Owner', clinic?.ownerName ?? user.name], ['Contact', clinic?.contactEmail ?? user.email], ['Address', clinic?.address ?? 'Not provided']]} />
      </Card>
    </>
  );
}
