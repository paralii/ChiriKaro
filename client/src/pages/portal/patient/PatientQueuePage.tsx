import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { patientQueueService, type PatientQueueEntry } from '@/features/patient/services/patientQueueService';
import { getErrorMessage } from '@/shared/lib/http';

function statusLabel(status: PatientQueueEntry['status']) {
  return status.replaceAll('_', ' ');
}

export default function PatientQueuePage() {
  const [entries, setEntries] = useState<PatientQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    try {
      setEntries(await patientQueueService.list());
      setError('');
      setLastUpdated(new Date());
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not load your queue status.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void patientQueueService.list().then((result) => {
      setEntries(result);
      setError('');
      setLastUpdated(new Date());
    }).catch((reason: unknown) => {
      setError(getErrorMessage(reason, 'Could not load your queue status.'));
    }).finally(() => setLoading(false));
    const timer = window.setInterval(() => { void refresh(true); }, 15_000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  return <Card className="overflow-hidden">
    <SectionHeading title="My queue" description="Queue status is updated by your clinic. This page refreshes automatically every 15 seconds." />
    <div className="p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="m-0 text-sm text-text-muted">{lastUpdated ? `Last updated ${new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(lastUpdated)}` : 'Waiting for queue status'}</p><Button size="sm" variant="secondary" disabled={refreshing} onClick={() => void refresh(true)}>{refreshing ? 'Refreshing…' : 'Refresh now'}</Button></div>
      {error ? <p role="alert" className="mt-4 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-text-muted">Loading your queue status…</p> : null}
      {!loading && !error && entries.length === 0 ? <div className="mt-4 rounded-lg border border-border bg-surface p-4 sm:p-5"><p className="m-0 text-sm text-text-secondary">You have no queue entries yet.</p><p className="mb-0 mt-2 text-sm text-text-muted">When clinic staff check you in, your token and status will appear here.</p></div> : null}
      <div className="mt-4 grid gap-3">{entries.map((entry, index) => <article key={`${entry.createdAt}-${entry.tokenNumber}-${index}`} className="flex flex-col gap-4 rounded-lg border border-border bg-surface-elevated p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0"><p className="m-0 wrap-break-word text-base font-semibold text-text-primary">{entry.clinicName}</p><p className="mb-0 mt-1 text-sm text-text-muted">{entry.doctorName} · {entry.kind === 'APPOINTMENT' ? 'Appointment check-in' : 'Walk-in'} · {entry.localDate}</p></div>
        <div className="flex flex-wrap items-center gap-3 sm:shrink-0"><div className="text-left sm:text-right"><p className="m-0 text-xs font-semibold uppercase tracking-wide text-text-muted">Token</p><p className="m-0 text-3xl leading-tight font-bold tabular-nums text-primary-hover">{entry.tokenNumber}</p></div><span className="rounded-full bg-primary-soft px-3 py-1.5 text-sm font-semibold text-primary-hover">{statusLabel(entry.status)}</span></div>
      </article>)}</div>
    </div>
  </Card>;
}
