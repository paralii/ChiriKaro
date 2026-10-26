import type { ReactNode } from 'react';

export const tdClass = 'border-t border-[#eff0f4] px-[15px] py-[11px] align-middle text-[10px] text-[#565b69] max-[1050px]:px-2.5';

export function CellTitle({ title, lines = [] }: { title: ReactNode; lines?: ReactNode[] }) {
  return <><strong className="block text-[11px] text-[#2b2e39]">{title}</strong>{lines.map((l, i) => <small key={i} className="mt-1 block text-[9px] text-[#858997]">{l}</small>)}</>;
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-left max-md:min-w-[690px]">
        <thead><tr>{headers.map((h) => <th key={h} className="h-[37px] bg-[#f7f8fb] px-[15px] text-[9px] font-bold whitespace-nowrap text-[#777c8a] max-[1050px]:px-2.5">{h}</th>)}</tr></thead>
        <tbody className="[&>tr:hover]:bg-[#fafbff]">{children}</tbody>
      </table>
    </div>
  );
}