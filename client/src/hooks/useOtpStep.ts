import { useEffect, useState } from 'react';
import { normalizeEmail } from '@/utils/validators';

export function useOtpStep(onChange?: (verifying: boolean) => void) {
  const [verifying, setVerifying] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState('');
  useEffect(() => { onChange?.(verifying); }, [verifying, onChange]);
  return {
    verifying, setVerifying,
    markRequested: (email: string) => setRequestedEmail(normalizeEmail(email)),
    hasRequestedFor: (email: string) => requestedEmail === normalizeEmail(email),
  };
}