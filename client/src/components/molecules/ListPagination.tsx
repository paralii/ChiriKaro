import { Button } from '@/components/atoms/Button';

type Props = {
  page: number;
  totalPages: number;
  totalItems: number;
  busy: boolean;
  onPageChange: (page: number) => void;
  size?: 'xs' | 'sm';
};

export function ListPagination({ page, totalPages, totalItems, busy, onPageChange, size = 'xs' }: Props) {
  if (totalItems === 0) return null;
  return <nav aria-label="List pages" className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-5">
    <span aria-live="polite" className="text-sm text-text-secondary">{totalItems} results · Page <strong className="font-semibold text-text-primary">{page}</strong> of {Math.max(totalPages, 1)}</span>
    {totalPages > 1 ? <div className="flex items-center gap-2">
      <Button type="button" size={size} variant="ghost" disabled={busy || page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
      <Button type="button" size={size} variant="ghost" disabled={busy || page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
    </div> : null}
  </nav>;
}
