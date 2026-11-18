import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { queueService, type QueueDay, type QueueDoctor, type QueueEntry } from '@/features/clinic/services/queueService';
import { getErrorMessage } from '@/shared/lib/http';
import { useAppSelector } from '@/store/hooks';

type QueueTransition = QueueEntry['status'];
function availableActions(status: QueueEntry['status'], role: string): Array<{ target: QueueTransition; label: string }> {
  const admin: Partial<Record<QueueEntry['status'], Array<{ target: QueueTransition; label: string }>>> = {
    WAITING: [{ target: 'IN_CONSULTATION', label: 'Start consultation' }, { target: 'SKIPPED', label: 'Skip' }, { target: 'CANCELLED', label: 'Cancel' }, { target: 'NO_SHOW', label: 'Mark no-show' }],
    IN_CONSULTATION: [{ target: 'COMPLETED', label: 'Complete' }],
    SKIPPED: [{ target: 'WAITING', label: 'Recall' }, { target: 'CANCELLED', label: 'Cancel' }, { target: 'NO_SHOW', label: 'Mark no-show' }],
  };
  if (role === 'CLINIC_ADMIN') return admin[status] ?? [];
  if (role === 'STAFF') return status === 'WAITING' || status === 'SKIPPED' ? [{ target: 'CANCELLED', label: 'Cancel' }, { target: 'NO_SHOW', label: 'Mark no-show' }] : [];
  if (role === 'DOCTOR') {
    if (status === 'WAITING') return [{ target: 'IN_CONSULTATION', label: 'Start consultation' }, { target: 'SKIPPED', label: 'Skip' }, { target: 'NO_SHOW', label: 'Mark no-show' }];
    if (status === 'IN_CONSULTATION') return [{ target: 'COMPLETED', label: 'Complete' }];
    if (status === 'SKIPPED') return [{ target: 'WAITING', label: 'Recall' }, { target: 'NO_SHOW', label: 'Mark no-show' }];
  }
  return [];
}

export default function ClinicQueuePage({ canRegister = true }: { canRegister?: boolean }) {
  const actorRole = useAppSelector((state) => state.auth.user?.role ?? '');
  const [queue, setQueue] = useState<QueueDay | null>(null);
  const [doctors, setDoctors] = useState<QueueDoctor[]>([]);
  const [doctorUserId, setDoctorUserId] = useState('');
  const [recordType, setRecordType] = useState<'EXISTING' | 'GUEST'>('EXISTING');
  const [patientEmail, setPatientEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [appointmentId, setAppointmentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [token, setToken] = useState<QueueEntry | null>(null);
  const [transitioningId, setTransitioningId] = useState('');
  const idempotencyKey = useRef(crypto.randomUUID());

  const refreshQueue = useCallback(async () => {
    setError('');
    try { setQueue(await queueService.list()); }
    catch (reason) { setError(getErrorMessage(reason, 'Could not load today’s queue.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void Promise.all([queueService.list(), queueService.doctors()]).then(([nextQueue, nextDoctors]) => {
      if (!active) return;
      setQueue(nextQueue); setDoctors(nextDoctors);
      if (nextDoctors[0]) setDoctorUserId(nextDoctors[0].doctorUserId);
    }).catch((reason: unknown) => { if (active) setError(getErrorMessage(reason, 'Could not load queue details.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => { void refreshQueue(); }, 15_000);
    return () => window.clearInterval(timer);
  }, [refreshQueue]);

  const onWalkInSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!doctorUserId) { setError('Choose a verified doctor first.'); return; }
    setBusy(true); setError(''); setNotice(''); setToken(null);
    try {
      const body = recordType === 'EXISTING'
        ? { doctorUserId, patientEmail: patientEmail.trim() }
        : { doctorUserId, guestName: guestName.trim() };
      const created = await queueService.registerWalkIn(body, idempotencyKey.current);
      setToken(created); setNotice('Walk-in added to the shared arrival queue.');
      idempotencyKey.current = crypto.randomUUID();
      setPatientEmail(''); setGuestName('');
      await refreshQueue();
    } catch (reason) { setError(getErrorMessage(reason, 'Could not register this walk-in.')); }
    finally { setBusy(false); }
  };

  const onCheckInSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true); setError(''); setNotice(''); setToken(null);
    try {
      const created = await queueService.checkInAppointment(appointmentId.trim());
      setToken(created); setNotice('Confirmed appointment checked in at arrival.'); setAppointmentId('');
      await refreshQueue();
    } catch (reason) { setError(getErrorMessage(reason, 'Could not check in this appointment.')); }
    finally { setBusy(false); }
  };

  const changeStatus = async (entry: QueueEntry, status: QueueTransition) => {
    setTransitioningId(entry.queueEntryId); setError('');
    try {
      const updated = await queueService.transition(entry.queueEntryId, status);
      setQueue((current) => current ? { ...current, entries: current.entries.map((item) => item.queueEntryId === updated.queueEntryId ? updated : item) } : current);
      setNotice(`Token ${updated.tokenNumber} is now ${updated.status.replaceAll('_', ' ').toLowerCase()}.`);
    } catch (reason) {
      setError(getErrorMessage(reason, 'Queue status changed. Refresh the queue and try again.'));
      await refreshQueue();
    } finally { setTransitioningId(''); }
  };

  return <div className="grid gap-4">
    <Card className="overflow-hidden">
      <SectionHeading title={actorRole === 'DOCTOR' ? 'My doctor queue' : 'Today’s clinic queue'} description="Walk-ins and confirmed appointments share one clinic-day queue. Tokens follow arrival order across doctors. Queue updates refresh automatically every 15 seconds." />
      <div className="p-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-2"><p className="m-0 text-xs text-[#737987]">{queue ? `${queue.localDate} · clinic time (${queue.timeZone})` : 'Loading clinic day…'}</p><Button size="sm" variant="secondary" onClick={() => void refreshQueue()}>Refresh</Button></div>
        {error ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {notice ? <p role="status" className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p> : null}
        {token ? <div className="mt-3 rounded-lg border border-brand/20 bg-[#f3f6ff] p-4"><p className="m-0 text-xs font-semibold uppercase text-brand-deep">Queue token issued</p><p className="mb-0 mt-1 text-3xl font-bold text-brand-deep">{token.tokenNumber}</p><p className="mb-0 mt-1 text-sm">{token.patientName} · {token.doctorName}</p></div> : null}
        {loading ? <p className="mt-4 text-sm text-[#737987]">Loading queue…</p> : queue?.entries.length ? <ol className="mt-4 grid gap-2 p-0">{queue.entries.map((entry) => <li key={entry.queueEntryId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#e6e7ee] p-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f5ff] text-sm font-bold text-brand-deep">{entry.tokenNumber}</span><div><p className="m-0 text-sm font-semibold">{entry.patientName}</p><p className="m-0 mt-0.5 text-xs text-[#737987]">{entry.doctorName} · {entry.kind === 'APPOINTMENT' ? 'Appointment check-in' : 'Walk-in'}</p></div></div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-900">{entry.status.replaceAll('_', ' ')}</span>{availableActions(entry.status, actorRole).map((action) => <Button key={action.target} size="xs" variant="secondary" disabled={Boolean(transitioningId)} onClick={() => void changeStatus(entry, action.target)}>{transitioningId === entry.queueEntryId ? 'Updating…' : action.label}</Button>)}</div></li>)}</ol> : !loading && !error ? <p className="mt-4 rounded-md bg-[#f7f8fb] p-4 text-sm text-[#686e7b]">No patients have joined today’s queue.</p> : null}
      </div>
    </Card>

    {canRegister ? <div className="grid gap-4 lg:grid-cols-2">
      <Card className="overflow-hidden"><SectionHeading title="Register a walk-in" description="Use an active patient account or create a minimal guest entry." /><form className="grid gap-3 p-[18px]" onSubmit={(event) => void onWalkInSubmit(event)}>
        <label className="grid gap-1.5 text-xs font-semibold text-[#555b69]">Doctor<select className="min-h-10 rounded-md border border-[#dce2f1] bg-white px-3 text-sm" value={doctorUserId} onChange={(event) => { setDoctorUserId(event.target.value); idempotencyKey.current = crypto.randomUUID(); }} required><option value="">Select verified doctor</option>{doctors.map((doctor) => <option key={doctor.doctorUserId} value={doctor.doctorUserId}>{doctor.name}</option>)}</select></label>
        <div className="flex gap-2"><Button type="button" size="sm" variant={recordType === 'EXISTING' ? 'primary' : 'secondary'} onClick={() => { setRecordType('EXISTING'); idempotencyKey.current = crypto.randomUUID(); }}>Existing patient</Button><Button type="button" size="sm" variant={recordType === 'GUEST' ? 'primary' : 'secondary'} onClick={() => { setRecordType('GUEST'); idempotencyKey.current = crypto.randomUUID(); }}>Guest</Button></div>
        {recordType === 'EXISTING' ? <label className="grid gap-1.5 text-xs font-semibold text-[#555b69]">Patient account email<Input type="email" autoComplete="email" maxLength={254} value={patientEmail} onChange={(event) => { setPatientEmail(event.target.value); idempotencyKey.current = crypto.randomUUID(); }} required /></label> : <label className="grid gap-1.5 text-xs font-semibold text-[#555b69]">Guest name<Input maxLength={120} value={guestName} onChange={(event) => { setGuestName(event.target.value); idempotencyKey.current = crypto.randomUUID(); }} required /></label>}
        <Button type="submit" disabled={busy || !doctors.length}>{busy ? 'Registering…' : 'Register and issue token'}</Button>
      </form></Card>
      <Card className="overflow-hidden"><SectionHeading title="Check in an appointment" description="Add a confirmed appointment to the shared queue when the patient arrives." /><form className="grid gap-3 p-[18px]" onSubmit={(event) => void onCheckInSubmit(event)}><label className="grid gap-1.5 text-xs font-semibold text-[#555b69]">Appointment ID<Input value={appointmentId} onChange={(event) => setAppointmentId(event.target.value)} required /></label><p className="m-0 text-xs text-[#737987]">Only a confirmed appointment for this clinic today can join the queue. Duplicate check-ins return the existing token.</p><Button type="submit" disabled={busy}>{busy ? 'Checking in…' : 'Check in at arrival'}</Button></form></Card>
    </div> : null}
  </div>;
}
