import { Fragment } from 'react';

export function DetailList({ items }: { items: [string, string | number | null | undefined][] }) {
  return (
    <div className="grid grid-cols-[minmax(6rem,0.45fr)_minmax(0,1fr)] gap-x-4 px-4 pt-2 pb-4 sm:gap-x-5 sm:px-5">
      {items.map(([label, value]) => (
        <Fragment key={label}>
          <span className="min-h-11 border-b border-border py-3 text-sm leading-normal text-text-muted">{label}</span>
          <strong className="min-h-11 border-b border-border py-3 text-sm leading-normal font-medium break-words text-text-primary">{value ?? 'Not provided'}</strong>
        </Fragment>
      ))}
    </div>
  );
}
