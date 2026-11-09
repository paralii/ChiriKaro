import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/atoms/Card';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { WorkingHoursForm } from '@/features/clinic/components/WorkingHoursForm';
import { DoctorAvailabilityStep } from '@/features/doctor/components/DoctorAvailabilityStep';
import { DoctorBreaksForm } from '@/features/doctor/components/DoctorBreaksForm';
import { clinicService } from '@/features/clinic/services/clinicService';
import { doctorService } from '@/features/doctor/services/doctorService';
import { defaultHours } from '@/shared/constants/schedule';
import { useAction } from '@/shared/hooks/useAction';
import { findClinicHoursConflict, findInvalidHours, getDoctorBreakError, sortAvailabilitySlots, toDisplayWorkingHours, toDoctorWorkingHours } from '@/shared/utils/doctor';
import type { DoctorAvailability, DoctorAvailabilitySlot, DoctorBreak, WorkingHour } from '@/shared/types';

type AvailabilityUpdates = Pick<DoctorAvailability, 'workingHours' | 'breaks' | 'slotDurationMinutes' | 'bufferTimeMinutes'>;

export default function DoctorAvailabilityPage() {
  const [availability, setAvailability] = useState<DoctorAvailability | null>(null);
  const [clinicHours, setClinicHours] = useState<WorkingHour[]>([]);
  const [slots, setSlots] = useState<DoctorAvailabilitySlot[]>([]);
  const { busy, error, message, setError, run } = useAction();

  useEffect(() => {
    void run(async () => {
      const [saved, clinic] = await Promise.all([doctorService.getAvailability(), clinicService.getProfile()]);
      setAvailability(saved);
      setClinicHours(clinic.workingHours ?? []);
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

  const hours = availability?.workingHours.length
    ? toDisplayWorkingHours(availability.workingHours)
    : clinicHours.length ? clinicHours : defaultHours;

  return (
    <div className="grid gap-[18px] [&>section]:mt-0">
      <Notices error={error} message={message} />
      {!availability && busy ? <Card className="p-[18px] text-sm text-[#777c8a]">Loading doctor availability...</Card> : null}
      {!availability && !busy ? (
        <Card className="p-[18px] text-sm text-[#777c8a]">
          Availability could not be loaded. Complete basic doctor onboarding if needed, then reload this page. <Link className="ml-1 font-semibold text-brand-deep underline" to="/doctor/dashboard">Continue onboarding</Link>
        </Card>
      ) : null}
      {availability ? (
        <>
          <Card className="pb-5">
            <SectionHeading title="Working hours" description="Doctor hours must be within the clinic’s configured working hours. Adjust saved breaks before narrowing a shift." />
            <WorkingHoursForm initial={hours} busy={busy} onSave={saveHours} submitLabel="Save working hours" />
          </Card>
          <Card className="pb-5">
            <SectionHeading title="Breaks" description="Add breaks inside an open working day. Breaks on the same day cannot overlap." />
            <DoctorBreaksForm initial={availability.breaks} busy={busy} onSave={saveBreaks} />
          </Card>
          <Card className="pb-5">
            <SectionHeading title="Slot settings and preview" description="Set slot duration and buffer time, then generate a preview of available times." />
            <DoctorAvailabilityStep slotDurationMinutes={availability.slotDurationMinutes} bufferTimeMinutes={availability.bufferTimeMinutes}
              slots={slots} busy={busy} onSaveConfig={saveSettings} onGenerate={generate} />
          </Card>
        </>
      ) : null}
    </div>
  );
}
