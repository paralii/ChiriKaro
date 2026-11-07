import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { Input } from '@components/atoms/Input';
import { Select } from '@components/atoms/Select';
import { FormField } from '@components/molecules/FormField';
import type { DoctorBreak, DoctorDayOfWeek } from '@shared/types';

const days: Array<{ value: DoctorDayOfWeek; label: string }> = [
  { value: 'MONDAY', label: 'Monday' }, { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' }, { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' }, { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

export function DoctorBreaksForm({ initial, busy, onSave }: {
  initial: DoctorBreak[];
  busy: boolean;
  onSave: (breaks: DoctorBreak[]) => void;
}) {
  const [breaks, setBreaks] = useState(initial);
  const patch = (index: number, change: Partial<DoctorBreak>) => setBreaks((current) => current.map((item, i) => i === index ? { ...item, ...change } : item));
  const submit = (event: FormEvent) => { event.preventDefault(); onSave(breaks); };

  return (
    <Form onSubmit={submit} className="gap-0 p-[18px]">
      {breaks.length ? breaks.map((item, index) => (
        <div key={`${item.day}-${index}`} className="grid grid-cols-[minmax(125px,1fr)_minmax(105px,150px)_minmax(105px,150px)_auto] items-end gap-3 border-b border-[#eff0f4] py-3 max-md:grid-cols-2">
          <FormField label="Day"><Select value={item.day} onChange={(event) => patch(index, { day: event.target.value as DoctorDayOfWeek })}>{days.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}</Select></FormField>
          <FormField label="Break starts"><Input type="time" value={item.startTime} onChange={(event) => patch(index, { startTime: event.target.value })} required /></FormField>
          <FormField label="Break ends"><Input type="time" value={item.endTime} onChange={(event) => patch(index, { endTime: event.target.value })} required /></FormField>
          <Button type="button" size="sm" variant="ghost" aria-label={`Remove ${item.day.toLowerCase()} break`} onClick={() => setBreaks((current) => current.filter((_, i) => i !== index))}>Remove</Button>
        </div>
      )) : <p className="m-0 pb-3 text-xs text-[#777b89]">No breaks added.</p>}
      <div className="flex flex-wrap gap-2 pt-3">
        <Button type="button" variant="secondary" disabled={busy} onClick={() => setBreaks((current) => [...current, { day: 'MONDAY', startTime: '12:00', endTime: '13:00' }])}>Add break</Button>
        <Button disabled={busy}>{busy ? 'Saving...' : 'Save breaks'}</Button>
      </div>
    </Form>
  );
}
