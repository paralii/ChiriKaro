import { useEffect } from 'react';
import { Card } from '@/components/atoms/Card';
import { TextLink } from '@/components/atoms/TextLink';
import { MetricCard, MetricGrid } from '@/components/molecules/MetricCard';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicTable } from '@/features/clinic/components/ClinicTable';
import { useAdminClinics } from '@/features/admin/hooks/useAdminClinics';
import { useAppDispatch } from '@/store/hooks';
import { loadAdminClinics } from '@/features/admin/store/adminClinicsSlice';

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const { items, summary, doctorStatistics, busy, error, message, changeStatus } = useAdminClinics();
  useEffect(() => { void dispatch(loadAdminClinics(1)); }, [dispatch]);
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
        <SectionHeading title="Doctor overview" description="Verification status across all registered doctors" />
        <div className="px-[18px] py-1">
          <MetricGrid>
            <MetricCard label="Total doctors" value={doctorStatistics.total} note="Registered on ChiriKaro" />
            <MetricCard label="Verified" value={doctorStatistics.verified} note="Approved to practice" />
            <MetricCard label="Pending verification" value={doctorStatistics.pendingVerification} note="Awaiting review" />
            <MetricCard label="Rejected" value={doctorStatistics.rejected} note="Not approved" />
          </MetricGrid>
          <SectionHeading as="h3" title="Onboarding status" description="High-level doctor verification progress" className="border-t" />
          <MetricGrid cols={3}>
            <MetricCard label="Not started" value={doctorStatistics.verificationOverview.notStarted} note="Onboarding not begun" />
            <MetricCard label="In progress" value={doctorStatistics.verificationOverview.inProgress} note="Onboarding underway" />
            <MetricCard label="Pending verification" value={doctorStatistics.verificationOverview.pendingVerification} note="Submitted for review" />
          </MetricGrid>
          <MetricGrid cols={2}>
            <MetricCard label="Verified" value={doctorStatistics.verificationOverview.verified} note="Verification complete" />
            <MetricCard label="Rejected" value={doctorStatistics.verificationOverview.rejected} note="Verification declined" />
          </MetricGrid>
        </div>
      </Card>
      <Card>
        <SectionHeading title="Recently registered" description="Clinic applications that need attention" action={<TextLink to="/app/pending">Review queue <span>&#8594;</span></TextLink>} />
        <ClinicTable clinics={items.slice(0, 5)} onStatus={changeStatus} busy={busy} />
      </Card>
    </>
  );
}
