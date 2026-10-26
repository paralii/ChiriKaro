export function DocumentList({ items, onOpen, openLabel = 'Open document' }: {
  items: { key: string; label: string; status?: string }[]; onOpen: (key: string) => void; openLabel?: string;
}) {
  return (
    <ul className="m-0 grid list-none px-[18px]">
      {items.map((d) => (
        <li key={d.key} className="flex min-h-11 items-center justify-between gap-3.5 border-t border-[#eff0f4] py-[9px] text-[11px] text-[#424756]">
          <span>{d.label}{d.status ? <small className="ml-[7px] text-[9px] text-[#777b89]">{d.status}</small> : null}</span>
          <button type="button" onClick={() => onOpen(d.key)} className="cursor-pointer text-[13px] font-semibold text-brand-deep hover:underline">{openLabel}</button>
        </li>
      ))}
    </ul>
  );
}