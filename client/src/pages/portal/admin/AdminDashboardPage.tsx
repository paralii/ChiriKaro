import { Card } from '@/components/atoms/Card';
import { TextLink } from '@/components/atoms/TextLink';
import { MetricCard, MetricGrid } from '@/components/molecules/MetricCard';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicTable } from '@/components/organisms/ClinicTable';
import { useAdminClinics } from '@/hooks/useAdminClinics';

export default function AdminDashboardPage() {
  const { items, summary, busy, error, message, changeStatus } = useAdminClinics();
  return (
    <>
      <Notices error={error} message={message} />
      <MetricGrid>
        <MetricCard label="Total clinics" value={summary.total} note="Registered on ChiriKaro" />
        <MetricCard label="Pending review" value={summary.pending} note="Awaiting a decision" />
        <MetricCard label="Approved" value={summary.approved} note="Active clinic accounts" />
        <MetricCard label="Blocked" value={summary.blocked} note="Access currently paused" />
      </MetricGrid>
      <Card>
        <SectionHeading title="Recently registered" description="Clinic applications that need attention" action={<TextLink to="/app/pending">Review queue <span>&#8594;</span></TextLink>} />
        <ClinicTable clinics={items.slice(0, 5)} onStatus={changeStatus} busy={busy} />
      </Card>
    </>
  );
}