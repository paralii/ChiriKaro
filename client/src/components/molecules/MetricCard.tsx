import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function MetricCard({ label, value, note, to, linkText, word }: {
  label: string; value: string | number; note: string; to?: string; linkText?: string; word?: boolean;
}) {
  return (
    <article className="flex min-w-0 animate-rise-in flex-col items-start rounded-lg border border-[#e4e6ee] bg-white px-[17px] pt-[17px] pb-[15px] max-md:min-h-[117px] max-[1050px]:px-3 max-[1050px]:py-3.5 max-[420px]:px-2.5 max-[420px]:py-3">
      <span className="text-[11px] text-[#777b89] max-[420px]:text-[10px]">{label}</span>
      <strong className={cn('mt-[13px] leading-[1.1] font-semibold tabular-nums', word ? 'text-xl' : 'text-[26px] max-md:text-[23px]')}>{value}</strong>
      <small className="mt-[7px] text-[10px] leading-normal text-[#858997] max-[420px]:text-[9px]">{note}</small>
      {to ? <Link to={to} className="mt-[13px] text-[10px] font-semibold text-brand-deep">{linkText} &#8594;</Link> : null}
    </article>
  );
}

export function MetricGrid({ cols = 4, children }: { cols?: 2 | 3 | 4; children: React.ReactNode }) {
  const map = { 2: 'grid-cols-2 mt-[17px]', 3: 'grid-cols-3 mt-[18px] max-[420px]:grid-cols-1', 4: 'grid-cols-4 max-md:grid-cols-2' };
  return <div className={cn('mb-[29px] grid gap-[13px] max-[1050px]:gap-2.5', map[cols])}>{children}</div>;
}