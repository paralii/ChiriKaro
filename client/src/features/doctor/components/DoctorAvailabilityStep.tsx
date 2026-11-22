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
      <Form onSubmit={submit} className="grid-cols-[1fr_1fr_auto] items-end gap-4 p-4 md:grid-cols-1 md:p-5 lg:grid-cols-[1fr_1fr_auto]">
        <TextField label="Slot duration (minutes)" type="number" min="5" max="240" step="1" value={duration} onChange={(event) => setDuration(Number(event.target.value))} required />
        <TextField label="Buffer between slots (minutes)" type="number" min="0" max="120" step="1" value={buffer} onChange={(event) => setBuffer(Number(event.target.value))} required />
        <Button variant="secondary" className="min-w-38.75 max-md:w-full" disabled={busy}>{busy ? 'Saving...' : 'Save slot settings'}</Button>
      </Form>
      <div className="px-4 pt-1 sm:px-5">
        <p className="mb-4 text-sm leading-relaxed text-text-secondary">This preview checks your weekly slots. Patient booking uses date-specific slots after your clinic approves your profile and sets your consultation fee.</p>
        <Button type="button" disabled={busy} onClick={onGenerate}>{busy ? 'Working...' : 'Generate availability preview'}</Button>
      </div>
      {slots.length ? (
        <ul className="mx-4 mt-4 grid list-none rounded-lg border border-border bg-surface-elevated p-0 sm:mx-5">
          {slots.map((slot, index) => (
            <li key={`${slot.day}-${slot.startTime}-${index}`} className="flex min-h-12 items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm text-text-secondary first:border-t-0">
              <span>{slot.day[0]}{slot.day.slice(1).toLowerCase()}</span><strong className="tabular-nums">{slot.startTime}–{slot.endTime}</strong>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
