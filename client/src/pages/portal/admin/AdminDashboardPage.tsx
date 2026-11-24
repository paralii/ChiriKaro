import { useEffect } from 'react';
import { Card } from '@/components/atoms/Card';
import { MetricCard, MetricGrid } from '@/components/molecules/MetricCard';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { Notice } from '@/components/atoms/Notice';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { useAppSelector } from '@/store/hooks';
import { useAdminClinics } from '@/features/admin/hooks/useAdminClinics';
import { useAppDispatch } from '@/store/hooks';
import { loadAdminClinics } from '@/features/admin/store/adminClinicsSlice';
import { useAnalytics } from '@/features/dashboard/services/useAnalytics';
import { AnalyticsPanel } from '@/components/molecules/AnalyticsPanel';

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const { summary, error, message } = useAdminClinics();
  const pendingCount = useAppSelector((s) => s.adminClinics.summary.pending);
  const analytics = useAnalytics('SUPER_ADMIN');
  useEffect(() => { void dispatch(loadAdminClinics({ page: 1 })); }, [dispatch]);
  return (
    <>
      <Notices error={error} message={message} />
      {pendingCount > 0 ? <Notice tone="warning"><strong>{pendingCount} clinic{pendingCount === 1 ? '' : 's'} waiting for review</strong><p className="mb-2 mt-1">Review each clinic’s submitted details and documents before approval.</p><Link className="inline-flex rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" to="/app/pending"><Button size="xs">Open review queue</Button></Link></Notice> : null}
      <MetricGrid cols={3}>
        <MetricCard label="Total clinics" value={summary.total} note="Registered on ChiriKaro" />
        <MetricCard label="Pending review" value={summary.pending} note="Awaiting a decision" />
        <MetricCard label="Approved" value={summary.approved} note="Active clinic accounts" />
      </MetricGrid>
      <Card className="overflow-hidden"><SectionHeading title="Review clinics" description="Open the review queue to inspect submitted clinic information and make an approval decision." action={<Link to="/app/pending" className="inline-flex min-h-9 items-center rounded-sm text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Pending clinics →</Link>} /></Card>
      {analytics.error ? <Notices error={analytics.error} /> : null}
      <AnalyticsPanel {...analytics} mode="platform" />
    </>
  );
}
