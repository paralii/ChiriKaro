import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/molecules/FormField';
import type { Slot } from '@/types';

export function DoctorAvailabilityStep({ slotDuration, bufferMinutes, slots, busy, onSaveConfig, onGenerate }: {
  slotDuration: number; bufferMinutes: number; slots: Slot[]; busy: boolean;
  onSaveConfig: (v: { slotDuration: number; bufferMinutes: number }) => void; onGenerate: () => void;
}) {
  const [duration, setDuration] = useState(slotDuration);
  const [buffer, setBuffer] = useState(bufferMinutes);
  const submit = (e: FormEvent) => { e.preventDefault(); onSaveConfig({ slotDuration: duration, bufferMinutes: buffer }); };

  return (
    <>
      <Form onSubmit={submit} className="grid-cols-[1fr_1fr_auto] items-end p-[19px] max-md:grid-cols-1">
        <TextField label="Slot duration (minutes)" type="number" min="5" max="180" step="1" value={duration} onChange={(e) => setDuration(Number(e.target.value))} required />
        <TextField label="Buffer between slots (minutes)" type="number" min="0" max="120" step="1" value={buffer} onChange={(e) => setBuffer(Number(e.target.value))} required />
        <Button variant="secondary" className="min-w-[155px] max-md:w-full" disabled={busy}>{busy ? 'Saving...' : 'Save slot settings'}</Button>
      </Form>
      <div className="px-[19px]"><Button type="button" disabled={busy} onClick={onGenerate}>{busy ? 'Working...' : 'Generate availability'}</Button></div>
      {slots.length ? (
        <ul className="mx-[18px] mt-3.5 grid list-none rounded-md border border-[#e4e6ee] p-0">
          {slots.map((s, i) => (
            <li key={`${s.day}-${s.startTime}-${i}`} className="flex min-h-11 items-center justify-between gap-3.5 border-t border-[#eff0f4] px-[11px] py-[9px] text-[11px] text-[#424756] first:border-t-0">
              <span>{s.day}</span><strong className="tabular-nums">{s.startTime}–{s.endTime}</strong>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}