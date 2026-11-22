import type { ReactNode } from 'react';

export const tdClass = 'h-14 border-t border-border px-4 py-3 align-middle text-sm text-text-secondary sm:px-5';

export function CellTitle({ title, lines = [] }: { title: ReactNode; lines?: ReactNode[] }) {
  return <><strong className="block text-sm font-semibold text-text-primary">{title}</strong>{lines.map((l, i) => <small key={i} className="mt-1 block text-xs leading-normal text-text-muted">{l}</small>)}</>;
}

export function DataTable({ headers, children }: { headers: string[]; children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-b-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead><tr>{headers.map((h) => <th key={h} scope="col" className="h-11 bg-page px-4 text-xs font-semibold tracking-wide whitespace-nowrap text-text-secondary sm:px-5">{h}</th>)}</tr></thead>
        <tbody className="[&>tr]:transition-colors [&>tr]:duration-interactive [&>tr:hover]:bg-primary-soft/40 [&>tr:focus-within]:bg-primary-soft/40">{children}</tbody>
      </table>
    </div>
  );
}
