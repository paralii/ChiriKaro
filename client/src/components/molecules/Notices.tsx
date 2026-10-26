import { Notice } from '@/components/atoms/Notice';

export function Notices({ error, message }: { error?: string; message?: string }) {
  return <>{error ? <Notice tone="error">{error}</Notice> : null}{message ? <Notice tone="success">{message}</Notice> : null}</>;
}