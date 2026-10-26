import { cn } from '@/lib/cn';

export function StepTabs({ steps, active, onSelect }: { steps: string[]; active: number; onSelect: (i: number) => void }) {
  return (
    <nav aria-label="Onboarding steps" className="flex flex-wrap gap-[7px] pb-1 max-md:grid max-md:grid-cols-2">
      {steps.map((step, i) => (
        <button key={step} type="button" onClick={() => onSelect(i)} aria-current={active === i ? 'step' : undefined}
          className={cn('inline-flex min-h-[34px] min-w-0 cursor-pointer items-center gap-[7px] rounded-[5px] border border-[#e1e4ec] bg-white px-2.5 text-[10px] font-semibold text-[#4e5361] hover:border-[#b7c9ff] hover:bg-brand-soft hover:text-brand-deep',
            active === i && 'border-[#b7c9ff] bg-brand-soft text-brand-deep')}>
          <span className="text-[9px] font-bold text-ck-teal">0{i + 1}</span>{step}
        </button>
      ))}
    </nav>
  );
}