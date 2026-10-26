import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/lib/http';

type Options<T> = { success?: string | ((result: T) => string); fallback?: string };

export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const run = useCallback(async <T>(fn: () => Promise<T>, options: Options<T> = {}) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await fn();
      if (options.success) setMessage(typeof options.success === 'function' ? options.success(result) : options.success);
      return result;
    } catch (e) {
      setError(getErrorMessage(e, options.fallback ?? 'Something went wrong. Please try again.'));
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, message, setError, setMessage, run };
}