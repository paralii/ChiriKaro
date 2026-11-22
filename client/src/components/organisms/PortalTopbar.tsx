import { Link } from 'react-router-dom';

export function PortalTopbar({ title, userName, profileTo }: { title: string; userName: string; profileTo?: string }) {
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <header className="flex min-h-14 items-center justify-between gap-3 border-b border-border bg-surface-elevated px-4 sm:px-6 lg:px-8">
      <div className="min-w-0 truncate text-sm text-text-secondary"><span className="hidden text-text-muted sm:inline">ChiriKaro <span className="px-2 text-border-strong">/</span></span>{title}</div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <span className="mr-1 hidden text-xs text-text-muted lg:inline">{today}</span>
        {profileTo ? <Link aria-label="Open profile" to={profileTo} className="grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-hover transition-colors duration-interactive hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{userName.slice(0, 1).toUpperCase()}</Link> : <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary-hover">{userName.slice(0, 1).toUpperCase()}</span>}
        <span className="max-w-28 truncate text-sm font-semibold text-text-primary sm:max-w-40">{userName}</span>
      </div>
    </header>
  );
}
