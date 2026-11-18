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
    <div className="p-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="m-0 text-xs text-[#737987]">{lastUpdated ? `Last updated ${new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(lastUpdated)}` : 'Waiting for queue status'}</p><Button size="sm" variant="secondary" disabled={refreshing} onClick={() => void refresh(true)}>{refreshing ? 'Refreshing…' : 'Refresh now'}</Button></div>
      {error ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="mt-4 text-sm text-[#737987]">Loading your queue status…</p> : null}
      {!loading && !error && entries.length === 0 ? <div className="mt-4 rounded-md bg-[#f7f8fb] p-4"><p className="m-0 text-sm text-[#686e7b]">You have no queue entries yet.</p><p className="mb-0 mt-1 text-xs text-[#737987]">When clinic staff check you in, your token and status will appear here.</p></div> : null}
      <div className="mt-4 grid gap-3">{entries.map((entry, index) => <article key={`${entry.createdAt}-${entry.tokenNumber}-${index}`} className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-[#e6e7ee] p-4">
        <div><p className="m-0 text-sm font-semibold">{entry.clinicName}</p><p className="mb-0 mt-1 text-xs text-[#737987]">{entry.doctorName} · {entry.kind === 'APPOINTMENT' ? 'Appointment check-in' : 'Walk-in'} · {entry.localDate}</p><p className="mb-0 mt-1 text-[10px] text-[#8a8e9a]">Clinic local time ({entry.timeZone})</p></div>
        <div className="flex items-center gap-3"><div className="text-right"><p className="m-0 text-[10px] font-semibold uppercase tracking-wide text-[#737987]">Token</p><p className="m-0 text-2xl font-bold text-brand-deep">{entry.tokenNumber}</p></div><span className="rounded-full bg-[#f3f5ff] px-3 py-1.5 text-xs font-semibold text-brand-deep">{statusLabel(entry.status)}</span></div>
      </article>)}</div>
    </div>
  </Card>;
}
