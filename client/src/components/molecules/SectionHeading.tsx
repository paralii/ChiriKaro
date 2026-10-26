import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function SectionHeading({ title, description, action, as: Tag = 'h2', className }: {
  title: ReactNode; description?: ReactNode; action?: ReactNode; as?: 'h2' | 'h3'; className?: string;
}) {
  return (
    <div className={cn('flex items-center justify-between gap-[15px] border-b border-[#ececf1] px-[18px] py-[17px] max-[420px]:px-3', className)}>
      <div>
        <Tag className="m-0 text-sm max-[420px]:text-xs">{title}</Tag>
        {description ? <p className="mt-[5px] mb-0 text-[10px] text-[#7c808d]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}