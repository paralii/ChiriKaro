import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Notice } from '@/components/atoms/Notice';
import { EmptyState } from '@/components/molecules/EmptyState';

export type PatientNotificationItem = {
  id: string;
  title: string;
  message: string;
  category?: string | null;
  createdAt: string;
  readAt: string | null;
  to?: string | null;
};

type Props = {
  notifications: PatientNotificationItem[];
  loading: boolean;
  error?: string;
  onRetry?: () => void;
  onMarkRead: (notificationId: string) => Promise<void>;
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function PatientNotificationList({ notifications, loading, error, onRetry, onMarkRead }: Props) {
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [actionError, setActionError] = useState('');

  const markRead = async (id: string) => {
    if (pendingIds.has(id)) return;
    setActionError('');
    setPendingIds((current) => new Set(current).add(id));
    try {
      // Read state remains controlled by the parent and changes only after its API confirms success.
      await onMarkRead(id);
    } catch {
      setActionError('Could not mark this notification as read. Please try again.');
    } finally {
      setPendingIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }
  };

  return <Card className="mt-0 overflow-hidden">
    {loading ? <div aria-busy="true" className="grid gap-3 p-4 sm:p-5">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-lg border border-border bg-page" />)}<span className="sr-only">Loading notifications</span></div> : null}
    {!loading && error ? <div className="p-4 sm:p-5"><Notice tone="error">{error}</Notice>{onRetry ? <Button type="button" variant="secondary" size="sm" onClick={onRetry}>Try again</Button> : null}</div> : null}
    {!loading && !error && actionError ? <div className="px-4 pt-4 sm:px-5"><Notice tone="error">{actionError}</Notice></div> : null}
    {!loading && !error && notifications.length === 0 ? <EmptyState><p className="m-0 font-semibold text-text-secondary">No notifications yet</p><p className="mb-0 mt-1">Updates for your patient account will appear here when available.</p></EmptyState> : null}
    {!loading && !error && notifications.length ? <ul className="m-0 grid list-none gap-3 p-4 sm:p-5">
      {notifications.map((notification) => {
        const unread = notification.readAt === null;
        const pending = pendingIds.has(notification.id);
        return <li key={notification.id} className={`rounded-lg border p-4 sm:p-5 ${unread ? 'border-primary/30 bg-primary-soft/35' : 'border-border bg-surface'}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {unread ? <span aria-label="Unread" className="size-2 rounded-full bg-primary" /> : null}
                <h2 className="m-0 text-base font-semibold text-text-primary">{notification.title}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${unread ? 'bg-primary-soft text-primary-hover' : 'bg-page text-text-muted'}`}>{unread ? 'Unread' : 'Read'}</span>
                {notification.category ? <span className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-text-secondary">{notification.category}</span> : null}
              </div>
              <p className="mb-0 mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{notification.message}</p>
              <time className="mt-3 block text-xs text-text-muted" dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {notification.to ? <Link to={notification.to} className="inline-flex min-h-9 items-center rounded-sm text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">View details</Link> : null}
              {unread ? <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => void markRead(notification.id)}>{pending ? 'Updating…' : 'Mark as read'}</Button> : null}
            </div>
          </div>
        </li>;
      })}
    </ul> : null}
  </Card>;
}
