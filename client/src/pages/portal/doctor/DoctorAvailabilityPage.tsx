import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/atoms/Card';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { WorkingHoursForm } from '@/features/clinic/components/WorkingHoursForm';
import { DoctorAvailabilityStep } from '@/features/doctor/components/DoctorAvailabilityStep';
import { DoctorBreaksForm } from '@/features/doctor/components/DoctorBreaksForm';
import { doctorService } from '@/features/doctor/services/doctorService';
import { defaultHours } from '@/shared/constants/schedule';
import { useAction } from '@/shared/hooks/useAction';
import { findClinicHoursConflict, findInvalidHours, getDoctorBreakError, sortAvailabilitySlots, toDisplayWorkingHours, toDoctorWorkingHours } from '@/shared/utils/doctor';
import type { DoctorAvailability, DoctorAvailabilitySlot, DoctorBreak, WorkingHour } from '@/shared/types';
import type { DoctorLeave } from '@/shared/types';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';

type AvailabilityUpdates = Pick<DoctorAvailability, 'workingHours' | 'breaks' | 'slotDurationMinutes' | 'bufferTimeMinutes'>;

export default function DoctorAvailabilityPage() {
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [clinicHours, setClinicHours] = useState<WorkingHour[]>([]);
  const [slots, setSlots] = useState<DoctorAvailabilitySlot[]>([]);
  const [leaves, setLeaves] = useState<DoctorLeave[]>([]);
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const { busy, error, message, setError, run } = useAction();

  useEffect(() => {
    void run(async () => {
      const [saved, onboarding, savedLeaves] = await Promise.all([doctorService.getAvailability(), doctorService.getOnboarding(), doctorService.listLeaves()]);
      setAvailability(saved);
      setLeaves(savedLeaves);
      setClinicHours(onboarding.clinicWorkingHours ?? []);
      return saved;
    }, { fallback: 'Could not load doctor availability.' });
  }, [run]);

  const configure = (updates: Partial<AvailabilityUpdates>) => {
    if (!availability) return;
    const next = { ...availability, ...updates };
    const displayHours = toDisplayWorkingHours(next.workingHours);
    const invalidHours = findInvalidHours(displayHours);
    if (invalidHours) return setError(`${invalidHours.day}: closing time must be later than opening time.`);
    if (!displayHours.some((hour) => hour.isOpen)) return setError('Open at least one working day.');
    if (!clinicHours.length) return setError('Clinic working hours are not configured. Ask your Clinic Admin to set them first.');
    const clinicConflict = findClinicHoursConflict(displayHours, clinicHours);
    if (clinicConflict) return setError(`${clinicConflict.day}: doctor hours must fit within the clinic working hours.`);
    const breakError = getDoctorBreakError(next.breaks, displayHours);
    if (breakError) return setError(breakError);
    if (!Number.isInteger(next.slotDurationMinutes) || next.slotDurationMinutes < 5 || next.slotDurationMinutes > 240) {
      return setError('Slot duration must be a whole number between 5 and 240 minutes.');
    }
    if (!Number.isInteger(next.bufferTimeMinutes) || next.bufferTimeMinutes < 0 || next.bufferTimeMinutes > 120) {
      return setError('Buffer time must be a whole number between 0 and 120 minutes.');
    }

    void run(async () => {
      const updated = await doctorService.configureAvailability({
        workingHours: next.workingHours,
        breaks: next.breaks,
        slotDurationMinutes: next.slotDurationMinutes,
        bufferTimeMinutes: next.bufferTimeMinutes,
      });
      setAvailability(updated);
      setSlots([]);
      return updated;
    }, { success: 'Doctor availability saved.', fallback: 'Could not save doctor availability.' });
  };

  const saveHours = (hours: WorkingHour[]) => {
    const invalid = findInvalidHours(hours);
    if (invalid) return setError(`${invalid.day}: closing time must be later than opening time.`);
    configure({ workingHours: toDoctorWorkingHours(hours) });
  };

  const saveBreaks = (breaks: DoctorBreak[]) => configure({ breaks });

  const saveSettings = (settings: Pick<AvailabilityUpdates, 'slotDurationMinutes' | 'bufferTimeMinutes'>) => configure(settings);

  const generate = () => void run(async () => {
    const result = await doctorService.generateAvailabilitySlots();
    const generated = sortAvailabilitySlots(result.slots);
    setSlots(generated);
    return generated;
  }, { success: (generated) => `${generated.length} availability slots generated.`, fallback: 'Could not generate availability slots.' });

  const addLeave = () => void run(async () => {
    const updated = await doctorService.createLeave({ startDate: leaveStart, endDate: leaveEnd, ...(leaveReason.trim() ? { reason: leaveReason.trim() } : {}) });
    setLeaves(updated); setLeaveStart(''); setLeaveEnd(''); setLeaveReason(''); setSlots([]);
    return updated;
  }, { success: 'Leave saved. Bookings are unavailable for those dates.', fallback: 'Could not save leave.' });

  const removeLeave = (startDate: string) => void run(async () => {
    const updated = await doctorService.deleteLeave(startDate); setLeaves(updated); setSlots([]); return updated;
  }, { success: 'Leave removed.', fallback: 'Could not remove leave.' });

  const hours = availability?.workingHours.length
    ? toDisplayWorkingHours(availability.workingHours)
    : clinicHours.length ? clinicHours : defaultHours;

  return (
    <div className="grid gap-5 [&>section]:mt-0">
      <Notices error={error} message={message} />
      {!availability && busy ? <Card className="overflow-hidden p-4 text-sm text-text-muted sm:p-5">Loading doctor availability...</Card> : null}
      {!availability && !busy ? (
        <Card className="overflow-hidden p-4 text-sm leading-relaxed text-text-secondary sm:p-5">
          Availability could not be loaded. Complete basic doctor onboarding if needed, then reload this page. <Link className="ml-1 inline-flex min-h-9 items-center rounded-sm font-semibold text-primary-hover underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" to="/doctor/dashboard">Continue onboarding</Link>
        </Card>
      ) : null}
      {availability ? (
        <>
          <Card className="overflow-hidden pb-5">
            <SectionHeading title="Working hours" description="Doctor hours must be within the clinic’s configured working hours. Adjust saved breaks before narrowing a shift." />
            <WorkingHoursForm initial={hours} busy={busy} onSave={saveHours} submitLabel="Save working hours" />
          </Card>
          <Card className="overflow-hidden p-4 sm:p-5">
            <SectionHeading title="Doctor leave" description="Set full-day leave dates. Patients will not see appointment slots during this period; existing appointments are unchanged." />
            <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); addLeave(); }}>
              <label className="grid gap-1 text-sm font-medium text-text-primary">From<Input type="date" value={leaveStart} onChange={(event) => setLeaveStart(event.target.value)} required /></label>
              <label className="grid gap-1 text-sm font-medium text-text-primary">Through<Input type="date" min={leaveStart || undefined} value={leaveEnd} onChange={(event) => setLeaveEnd(event.target.value)} required /></label>
              <label className="grid gap-1 text-sm font-medium text-text-primary sm:col-span-2">Reason (optional)<Input maxLength={500} value={leaveReason} onChange={(event) => setLeaveReason(event.target.value)} /></label>
              <div><Button type="submit" disabled={busy || !leaveStart || !leaveEnd}>Add leave</Button></div>
            </form>
            <div className="mt-4 grid gap-2">
              {leaves.length === 0 ? <p className="text-sm text-text-muted">No leave dates scheduled.</p> : leaves.map((leave) => (
                <div key={leave.startDate} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                  <span className="text-text-primary">{leave.startDate}{leave.endDate !== leave.startDate ? ` to ${leave.endDate}` : ''}{leave.reason ? ` · ${leave.reason}` : ''}</span>
                  <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => removeLeave(leave.startDate)}>Remove</Button>
                </div>
              ))}
            </div>
          </Card>
          <Card className="overflow-hidden pb-5">
            <SectionHeading title="Breaks" description="Add breaks inside an open working day. Breaks on the same day cannot overlap." />
            <DoctorBreaksForm initial={availability.breaks} busy={busy} onSave={saveBreaks} />
          </Card>
          <Card className="overflow-hidden pb-5">
            <SectionHeading title="Slot settings and preview" description="Set slot duration and buffer time, then generate a preview of available times." />
            <DoctorAvailabilityStep slotDurationMinutes={availability.slotDurationMinutes} bufferTimeMinutes={availability.bufferTimeMinutes}
              slots={slots} busy={busy} onSaveConfig={saveSettings} onGenerate={generate} />
          </Card>
        </>
      ) : null}
    </div>
  );
}
