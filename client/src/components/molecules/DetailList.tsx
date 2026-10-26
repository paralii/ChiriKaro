import { Fragment } from 'react';

export function DetailList({ items }: { items: [string, string | number | null | undefined][] }) {
  return (
    <div className="grid grid-cols-[minmax(115px,0.45fr)_1fr] gap-x-5 px-[18px] pt-[7px] pb-3.5 max-[420px]:grid-cols-[minmax(85px,0.45fr)_1fr] max-[420px]:gap-x-3 max-[420px]:px-[13px]">
      {items.map(([label, value]) => (
        <Fragment key={label}>
          <span className="min-h-[39px] border-b border-[#f0f0f4] py-3 text-[11px] text-[#7e8290]">{label}</span>
          <strong className="min-h-[39px] border-b border-[#f0f0f4] py-3 text-[11px] font-medium break-words text-[#333744]">{value ?? 'Not provided'}</strong>
        </Fragment>
      ))}
    </div>
  );
}