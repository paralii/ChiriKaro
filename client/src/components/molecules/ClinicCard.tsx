import type { Clinic } from '@shared/types';

const arts = [
  { bg: 'bg-primary-soft', ring: 'border-primary/20', text: 'text-primary-hover' },
  { bg: 'bg-success-soft', ring: 'border-success/20', text: 'text-success' },
  { bg: 'bg-warning-soft', ring: 'border-warning/20', text: 'text-warning' },
];

export function ClinicCard({ clinic, index }: { clinic: Clinic; index: number }) {
  const art = arts[index % arts.length];
  const initials = clinic.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <article className="overflow-hidden rounded-lg border border-border bg-surface-elevated shadow-sm transition-shadow duration-interactive hover:shadow-md">
      <div className={`relative grid h-28 place-items-center overflow-hidden sm:h-32 ${art.bg}`}>
        <i className={`absolute -top-[83px] -left-[18px] size-[130px] rounded-full border ${art.ring}`} />
        <i className={`absolute -right-[39px] -bottom-[99px] size-[175px] rounded-full border ${art.ring}`} />
        <span className={`z-10 grid size-12 place-items-center rounded-lg border border-border bg-surface-elevated text-sm font-bold ${art.text}`}>{initials}</span>
      </div>
      <div className="p-4 sm:p-5">
        <span className="text-xs font-semibold tracking-wide text-text-muted">GENERAL DENTISTRY</span>
        <h3 className="mt-2 mb-1 text-base leading-snug font-semibold text-text-primary">{clinic.name}</h3>
        <p className="m-0 min-h-5 text-sm leading-normal text-text-secondary">{clinic.address}</p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm text-text-secondary">
          <span className="min-w-0 break-words">{clinic.phone}</span>
          <button aria-label={`Contact ${clinic.name}`} title="Contact clinic" className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-surface-elevated text-primary-hover transition-colors duration-interactive hover:border-primary hover:bg-primary-soft active:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">&#8599;</button>
        </div>
      </div>
    </article>
  );
}
