import { Eyebrow } from '@components/atoms/Eyebrow';
import { Badge } from '@components/atoms/Badge';

export function PageHeading({ eyebrow, title, chip }: { eyebrow: string; title: string; chip?: string }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
      <div className="min-w-0">
        <Eyebrow className="mb-1 text-primary-hover">{eyebrow}</Eyebrow>
        <h1 className="m-0 text-2xl leading-tight font-semibold text-text-primary sm:text-3xl">{title}</h1>
      </div>
      {chip ? <Badge className="shrink-0">{chip}</Badge> : null}
    </div>
  );
}
