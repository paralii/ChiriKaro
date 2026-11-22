import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';
import { Badge } from '@components/atoms/Badge';
import { Eyebrow } from '@components/atoms/Eyebrow';

export function WelcomeBand({ pill, eyebrow, title, description, action, variant = 'default', className }: {
  pill?: string; eyebrow?: string; title: ReactNode; description?: ReactNode; action?: ReactNode; variant?: 'default' | 'patient'; className?: string;
}) {
  return (
    <div className={cn('flex min-h-32 flex-col items-start justify-between gap-5 rounded-lg border border-border bg-surface-elevated p-5 shadow-sm sm:min-h-36 sm:flex-row sm:items-center sm:p-6',
      variant === 'patient' ? 'bg-[linear-gradient(110deg,#f1f3ff,#fff_66%,#fff2e9)]' : 'bg-[linear-gradient(110deg,#edf3ff,#f8faff_65%,#e8f4f3)]', className)}>
      <div className="min-w-0">
        {pill ? <Badge tone="pill">{pill}</Badge> : null}
        {eyebrow ? <Eyebrow className="text-brand-deep">{eyebrow}</Eyebrow> : null}
        <h2 className="mt-2 mb-1 text-xl leading-tight font-semibold text-text-primary sm:text-2xl">{title}</h2>
        {description ? <p className="m-0 max-w-2xl text-sm leading-relaxed text-text-secondary">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
