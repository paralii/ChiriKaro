export function DocumentList({ items, onOpen, onDelete, busy = false, openLabel = 'Open document' }: {
  items: { key: string; label: string; status?: string }[]; onOpen: (key: string) => void; onDelete?: (key: string) => void; busy?: boolean; openLabel?: string;
}) {
  if (!items.length) return <p className="px-[18px] pb-3 text-xs text-[#777c8a]">No documents uploaded yet.</p>;
  return (
    <ul className="m-0 grid list-none px-[18px]">
      {items.map((d) => (
        <li key={d.key} className="flex min-h-11 items-center justify-between gap-3.5 border-t border-[#eff0f4] py-[9px] text-[11px] text-[#424756]">
          <span>{d.label}{d.status ? <small className="ml-[7px] text-[9px] text-[#777b89]">{d.status}</small> : null}</span>
          <span className="flex shrink-0 items-center gap-3">
            <button type="button" disabled={busy} onClick={() => onOpen(d.key)} className="cursor-pointer text-[11px] font-semibold text-brand-deep hover:underline disabled:opacity-50">{openLabel}</button>
            {onDelete ? <button type="button" disabled={busy} onClick={() => onDelete(d.key)} className="cursor-pointer text-[11px] font-semibold text-[#a13c36] hover:underline disabled:opacity-50">Remove</button> : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
