import { cn } from '@shared/lib/cn';

export function StepTabs({ steps, active, onSelect }: { steps: string[]; active: number; onSelect: (i: number) => void }) {
  return (
    <nav aria-label="Onboarding steps" className="grid grid-cols-1 gap-2 pb-1 sm:grid-cols-2 lg:flex lg:flex-wrap">
      {steps.map((step, i) => (
        <button key={step} type="button" onClick={() => onSelect(i)} aria-current={active === i ? 'step' : undefined}
          className={cn('inline-flex min-h-10 min-w-0 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface-elevated px-3 text-left text-sm font-medium text-text-secondary transition-[color,background-color,border-color,box-shadow] duration-interactive hover:border-primary/50 hover:bg-primary-soft/50 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
            active === i && 'border-primary/40 bg-primary-soft font-semibold text-primary-hover')}>
          <span className={cn('grid size-6 shrink-0 place-items-center rounded-full bg-page text-xs font-semibold text-text-muted', active === i && 'bg-primary text-white')}>{String(i + 1).padStart(2, '0')}</span><span className="min-w-0 break-words">{step}</span>
        </button>
      ))}
    </nav>
  );
}
