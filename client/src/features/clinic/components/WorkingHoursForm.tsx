import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { Input } from '@/components/atoms/Input';
import { FormField } from '@/components/molecules/FormField';
import type { WorkingHour } from '@/shared/types';

export function WorkingHoursForm({
  initial,
  busy,
  onSave,
  startLabel = 'Opens',
  endLabel = 'Closes',
  submitLabel = 'Save working hours',
}: {
  initial: WorkingHour[];
  busy: boolean;
  onSave: (hours: WorkingHour[]) => void;
  startLabel?: string;
  endLabel?: string;
  submitLabel?: string;
}) {
  const [hours, setHours] = useState<WorkingHour[]>(() =>
    initial.map((hour) => ({ ...hour }))
  );

  const patch = (i: number, change: Partial<WorkingHour>) =>
    setHours((cur) =>
      cur.map((h, idx) =>
        idx === i ? { ...h, ...change } : h
      )
    );

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave(hours);
  };

  const time = 'h-11';

  return (
    <Form onSubmit={submit} className="gap-0">
      <div className="grid px-4 sm:px-5">
        {hours.map((h, i) => (
          <div
            key={`${h.day || 'day'}-${i}`}
            className="grid grid-cols-[minmax(0,1fr)_repeat(2,minmax(0,1fr))] items-center gap-3 border-b border-border py-3 sm:grid-cols-[minmax(125px,1fr)_repeat(2,minmax(115px,170px))] sm:gap-4"
          >
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-text-secondary max-sm:col-span-full">
              <input
                type="checkbox"
                className="size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                checked={Boolean(h.isOpen)}
                disabled={busy}
                onChange={(e) => patch(i, { isOpen: e.target.checked })}
              />
              <span>{h.day || `Day ${i + 1}`}</span>
            </label>

            <FormField label={startLabel} className="gap-1.5 text-sm font-medium text-text-secondary">
              <Input
                type="time"
                className={time}
                value={h.startTime ?? ''}
                disabled={!h.isOpen || busy}
                onChange={(e) => patch(i, { startTime: e.target.value })}
              />
            </FormField>

            <FormField label={endLabel} className="gap-1.5 text-sm font-medium text-text-secondary">
              <Input
                type="time"
                className={time}
                value={h.endTime ?? ''}
                disabled={!h.isOpen || busy}
                onChange={(e) => patch(i, { endTime: e.target.value })}
              />
            </FormField>
          </div>
        ))}
      </div>

      <Button className="mx-4 mt-4 justify-self-start sm:mx-5 sm:mt-5" disabled={busy}>
        {busy ? 'Saving...' : submitLabel}
      </Button>
    </Form>
  );
}
