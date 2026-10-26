import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/atoms/Badge';
import { Eyebrow } from '@/components/atoms/Eyebrow';

export function WelcomeBand({ pill, eyebrow, title, description, action, variant = 'default', className }: {
  pill?: string; eyebrow?: string; title: ReactNode; description?: ReactNode; action?: ReactNode; variant?: 'default' | 'patient'; className?: string;
}) {
  return (
    <div className={cn('flex min-h-[148px] items-center justify-between gap-5 rounded-lg border border-[#dfe7fa] p-[23px] max-md:min-h-[130px] max-md:p-[17px] max-[420px]:flex-col max-[420px]:items-start',
      variant === 'patient' ? 'bg-[linear-gradient(110deg,#f1f3ff,#fff_66%,#fff2e9)]' : 'bg-[linear-gradient(110deg,#edf3ff,#f8faff_65%,#e8f4f3)]', className)}>
      <div>
        {pill ? <Badge tone="pill">{pill}</Badge> : null}
        {eyebrow ? <Eyebrow className="text-brand-deep">{eyebrow}</Eyebrow> : null}
        <h2 className="mt-2 mb-[5px] text-xl">{title}</h2>
        {description ? <p className="m-0 text-[11px] leading-[1.6] text-[#676d7a]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}