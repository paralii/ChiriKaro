import { Eyebrow } from '@/components/atoms/Eyebrow';
import { Badge } from '@/components/atoms/Badge';

export function PageHeading({ eyebrow, title, chip }: { eyebrow: string; title: string; chip?: string }) {
  return (
    <div className="mb-[25px] flex items-center justify-between gap-[15px] max-md:mb-[18px]">
      <div>
        <Eyebrow className="mb-[5px] text-brand-deep">{eyebrow}</Eyebrow>
        <h1 className="m-0 text-[25px] leading-[1.2] max-md:text-[22px]">{title}</h1>
      </div>
      {chip ? <Badge>{chip}</Badge> : null}
    </div>
  );
}