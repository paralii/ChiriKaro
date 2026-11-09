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

export default function AdminDashboardPage() {
  const dispatch = useAppDispatch();
  const { summary, error, message } = useAdminClinics();
  const pendingCount = useAppSelector((s) => s.adminClinics.summary.pending);
  useEffect(() => { void dispatch(loadAdminClinics(1)); }, [dispatch]);
  return (
    <>
      <Notices error={error} message={message} />
      {pendingCount > 0 ? <Notice tone="warning"><strong>{pendingCount} clinic{pendingCount === 1 ? '' : 's'} waiting for review</strong><p className="mb-2 mt-1">Review each clinic’s submitted details and documents before approval.</p><Link to="/app/pending"><Button size="xs">Open review queue</Button></Link></Notice> : null}
      <MetricGrid>
        <MetricCard label="Total clinics" value={summary.total} note="Registered on ChiriKaro" />
        <MetricCard label="Pending review" value={summary.pending} note="Awaiting a decision" />
        <MetricCard label="Approved" value={summary.approved} note="Active clinic accounts" />
      </MetricGrid>
      <Card><SectionHeading title="Review clinics" description="Open the review queue to inspect submitted clinic information and make an approval decision." action={<Link to="/app/pending" className="text-xs font-semibold text-brand-deep">Pending clinics →</Link>} /></Card>
    </>
  );
}
