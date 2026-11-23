import { cn } from '@/shared/lib/cn';

export type PatientBookingStep = 'selection' | 'date' | 'time' | 'review' | 'confirm' | 'confirmation';

const steps: Array<{ id: PatientBookingStep; label: string }> = [
  { id: 'selection', label: 'Clinic & doctor' },
  { id: 'date', label: 'Date' },
  { id: 'time', label: 'Time' },
  { id: 'review', label: 'Review' },
  { id: 'confirm', label: 'Confirm' },
  { id: 'confirmation', label: 'Status' },
];

export function PatientBookingSteps({ current }: { current: PatientBookingStep }) {
  const currentIndex = steps.findIndex((step) => step.id === current);
  return <nav aria-label="Appointment booking steps" className="mb-5">
    <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {steps.map((step, index) => {
        const active = index === currentIndex;
        const complete = index < currentIndex;
        return <li key={step.id} aria-current={active ? 'step' : undefined} className={cn(
          'rounded-md border px-2 py-3 text-center text-xs font-semibold sm:px-3 sm:text-sm',
          active ? 'border-primary bg-primary-soft text-primary-hover' : complete ? 'border-success/30 bg-success-soft text-success' : 'border-border bg-surface text-text-muted',
        )}>
          <span className="block text-[0.65rem] uppercase tracking-wide">Step {index + 1}</span>
          <span>{step.label}</span>
        </li>;
      })}
    </ol>
  </nav>;
}
