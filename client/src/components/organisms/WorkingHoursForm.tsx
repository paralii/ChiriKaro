import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { Input } from '@/components/atoms/Input';
import { FormField } from '@/components/molecules/FormField';
import type { WorkingHour } from '@/types';

export function WorkingHoursForm({ initial, busy, onSave, startLabel = 'Opens', endLabel = 'Closes', submitLabel = 'Save working hours' }: {
  initial: WorkingHour[]; busy: boolean; onSave: (hours: WorkingHour[]) => void; startLabel?: string; endLabel?: string; submitLabel?: string;
}) {
  const [hours, setHours] = useState(initial);
  const patch = (i: number, change: Partial<WorkingHour>) => setHours((cur) => cur.map((h, idx) => (idx === i ? { ...h, ...change } : h)));
  const submit = (e: FormEvent) => { e.preventDefault(); onSave(hours); };
  const time = 'h-[38px] rounded-[5px] px-2 text-xs';

  return (
    <Form onSubmit={submit} className="gap-0">
      <div className="grid px-[18px]">
        {hours.map((h, i) => (
          <div key={h.day} className="grid grid-cols-[minmax(125px,1fr)_repeat(2,minmax(115px,170px))] items-center gap-3.5 border-b border-[#eff0f4] py-[11px] max-md:grid-cols-2 max-md:gap-[9px]">
            <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-[#656a79] max-md:col-span-full">
              <input type="checkbox" className="size-3.5 accent-brand" checked={h.isOpen} onChange={(e) => patch(i, { isOpen: e.target.checked })} /><span>{h.day}</span>
            </label>
            <FormField label={startLabel} className="gap-[5px] text-[10px] font-normal text-[#777b89]"><Input type="time" className={time} value={h.startTime} disabled={!h.isOpen} onChange={(e) => patch(i, { startTime: e.target.value })} /></FormField>
            <FormField label={endLabel} className="gap-[5px] text-[10px] font-normal text-[#777b89]"><Input type="time" className={time} value={h.endTime} disabled={!h.isOpen} onChange={(e) => patch(i, { endTime: e.target.value })} /></FormField>
          </div>
        ))}
      </div>
      <Button className="mx-[18px] mt-[18px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : submitLabel}</Button>
    </Form>
  );
}