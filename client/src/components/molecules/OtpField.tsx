import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { FormField } from './FormField';
import { useCooldown } from '@/hooks/useCooldown';
import { getErrorMessage } from '@/lib/http';
import { validateEmail } from '@/utils/validators';

interface Props {
  email: string;
  value: string;
  onChange: (value: string) => void;
  onRequest: () => Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  label?: string;
  initiallySent?: boolean;
  initialCooldown?: number;
}

export function OtpField({ email, value, onChange, onRequest, onError, disabled, label = 'Verification code', initiallySent = false, initialCooldown = 0 }: Props) {
  const [sent, setSent] = useState(initiallySent);
  const [requesting, setRequesting] = useState(false);
  const { cooldown, start } = useCooldown(initialCooldown);

  async function handleRequest() {
    setRequesting(true);
    try {
      if (!validateEmail(email)) throw new Error('Enter a valid email address before requesting a verification code.');
      await onRequest();
      onChange('');
      setSent(true);
      start(60);
    } catch (e) {
      onError?.(getErrorMessage(e, 'We could not send the code.'));
    } finally {
      setRequesting(false);
    }
  }

  return (
    <FormField label={label}>
      <div className="flex items-end gap-2.5">
        <Input name="otp" value={value} placeholder="123456" inputMode="numeric" maxLength={6} autoComplete="one-time-code"
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        <Button type="button" variant="secondary" className="shrink-0" disabled={disabled || requesting || cooldown > 0} onClick={handleRequest}>
          {requesting ? 'Sending...' : cooldown > 0 ? `Resend (${cooldown}s)` : sent ? 'Resend code' : 'Send code'}
        </Button>
      </div>
    </FormField>
  );
}