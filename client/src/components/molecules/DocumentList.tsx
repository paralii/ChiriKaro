import { Badge } from '@components/atoms/Badge';

export function DocumentList({ items, onOpen, onDelete, busy = false, openLabel = 'Open document' }: {
  items: { key: string; label: string; status?: string }[]; onOpen: (key: string) => void; onDelete?: (key: string) => void; busy?: boolean; openLabel?: string;
}) {
  if (!items.length) return <p className="m-0 px-4 pb-4 text-sm text-text-muted sm:px-5">No documents uploaded yet.</p>;
  return (
    <ul className="m-0 grid list-none px-4 sm:px-5">
      {items.map((d) => (
        <li key={d.key} className="flex min-h-14 flex-wrap items-center justify-between gap-3 border-t border-border py-3 text-sm text-text-secondary">
          <span className="flex min-w-0 flex-wrap items-center gap-2"><span className="break-words font-medium text-text-primary">{d.label}</span>{d.status ? <Badge>{d.status}</Badge> : null}</span>
          <span className="flex shrink-0 items-center gap-3">
            <button type="button" disabled={busy} onClick={() => onOpen(d.key)} className="min-h-9 cursor-pointer rounded-sm px-2 text-sm font-semibold text-primary-hover underline-offset-4 transition-colors duration-interactive hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50">{openLabel}</button>
            {onDelete ? <button type="button" disabled={busy} onClick={() => onDelete(d.key)} className="min-h-9 cursor-pointer rounded-sm px-2 text-sm font-semibold text-danger underline-offset-4 transition-colors duration-interactive hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50">Remove</button> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
