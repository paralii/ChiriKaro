import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { TextField } from '@components/molecules/FormField';
import type { DoctorAvailabilitySlot } from '@shared/types';

export function DoctorAvailabilityStep({ slotDurationMinutes, bufferTimeMinutes, slots, busy, onSaveConfig, onGenerate }: {
  slotDurationMinutes: number;
  bufferTimeMinutes: number;
  slots: DoctorAvailabilitySlot[];
  busy: boolean;
  onSaveConfig: (values: { slotDurationMinutes: number; bufferTimeMinutes: number }) => void;
  onGenerate: () => void;
}) {
  const [duration, setDuration] = useState(slotDurationMinutes);
  const [buffer, setBuffer] = useState(bufferTimeMinutes);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSaveConfig({ slotDurationMinutes: duration, bufferTimeMinutes: buffer });
  };

  return (
    <>
      <Form onSubmit={submit} className="grid-cols-[1fr_1fr_auto] items-end p-[19px] max-md:grid-cols-1">
        <TextField label="Slot duration (minutes)" type="number" min="5" max="240" step="1" value={duration} onChange={(event) => setDuration(Number(event.target.value))} required />
        <TextField label="Buffer between slots (minutes)" type="number" min="0" max="120" step="1" value={buffer} onChange={(event) => setBuffer(Number(event.target.value))} required />
        <Button variant="secondary" className="min-w-[155px] max-md:w-full" disabled={busy}>{busy ? 'Saving...' : 'Save slot settings'}</Button>
      </Form>
      <div className="px-[19px] pt-1">
        <p className="mb-3 text-xs text-[#777b89]">Generated times are a preview of your configured availability. Appointment booking is not included.</p>
        <Button type="button" disabled={busy} onClick={onGenerate}>{busy ? 'Working...' : 'Generate availability preview'}</Button>
      </div>
      {slots.length ? (
        <ul className="mx-[18px] mt-3.5 grid list-none rounded-md border border-[#e4e6ee] p-0">
          {slots.map((slot, index) => (
            <li key={`${slot.day}-${slot.startTime}-${index}`} className="flex min-h-11 items-center justify-between gap-3.5 border-t border-[#eff0f4] px-[11px] py-[9px] text-[11px] text-[#424756] first:border-t-0">
              <span>{slot.day[0]}{slot.day.slice(1).toLowerCase()}</span><strong className="tabular-nums">{slot.startTime}–{slot.endTime}</strong>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
