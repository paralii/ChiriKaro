import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function BrandLockup({ className }: { className?: string }) {
  return (
    <Link to="/" aria-label="ChiriKaro home" className={cn('inline-flex items-center gap-2.5 text-base font-bold text-ink', className)}>
      <span className="grid size-[34px] place-items-center rounded-[10px_10px_10px_3px] bg-brand text-[17px] font-bold text-white">C</span>
      <span>ChiriKaro</span>
    </Link>
  );
}