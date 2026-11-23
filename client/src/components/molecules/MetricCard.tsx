import { Link } from 'react-router-dom';
import { cn } from '@shared/lib/cn';

export function MetricCard({ label, value, note, to, linkText, word }: {
  label: string; value: string | number; note: string; to?: string; linkText?: string; word?: boolean;
}) {
  return (
    <article className="flex min-w-0 animate-rise-in flex-col items-start rounded-lg border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
      <span className="text-sm font-medium text-text-muted">{label}</span>
      <strong className={cn('mt-3 leading-tight font-semibold tabular-nums text-text-primary', word ? 'text-xl' : 'text-2xl sm:text-3xl')}>{value}</strong>
      <small className="mt-2 text-sm leading-normal text-text-muted">{note}</small>
      {to ? <Link to={to} className="mt-3 rounded-sm text-sm font-semibold text-primary-hover underline-offset-4 transition-colors duration-interactive hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{linkText} &#8594;</Link> : null}
    </article>
  );
}

export function MetricGrid({ cols = 4, children }: { cols?: 2 | 3 | 4; children: React.ReactNode }) {
  const map = { 2: 'grid-cols-1 sm:grid-cols-2 mt-4', 3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-4', 4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4' };
  return <div className={cn('mb-7 grid gap-3 sm:gap-4', map[cols])}>{children}</div>;
}
