import type { ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

export function SectionHeading({ title, description, action, as: Tag = 'h2', className }: {
  title: ReactNode; description?: ReactNode; action?: ReactNode; as?: 'h2' | 'h3'; className?: string;
}) {
  return (
    <div className={cn('flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:gap-4 sm:px-5', className)}>
      <div className="min-w-0 flex-1">
        <Tag className="m-0 text-base leading-tight font-semibold text-text-primary">{title}</Tag>
        {description ? <p className="mt-1.5 mb-0 text-sm leading-relaxed text-text-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
