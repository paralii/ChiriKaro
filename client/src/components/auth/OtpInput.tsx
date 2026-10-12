import { useEffect, useState } from 'react';

interface OtpInputProps {
  email: string;
  value: string;
  onChange: (value: string) => void;
  onRequest: () => Promise<void>;
  disabled?: boolean;
  label?: string;
  onRequestError?: (message: string) => void;
  initiallySent?: boolean;
  initialCooldown?: number;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OtpInput({
  email,
  value,
  onChange,
  onRequest,
  disabled = false,
  label = 'Verification code',
  onRequestError,
  initiallySent = false,
  initialCooldown = 0,
}: OtpInputProps) {
  const [otpSent, setOtpSent] = useState(initiallySent);
  const [cooldown, setCooldown] = useState(initialCooldown);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleRequest = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
      throw new Error('Enter a valid email address before requesting a verification code.');
    }

    await onRequest();
  onChange('');
    setOtpSent(true);
    setCooldown(60);
  };

  return (
    <label>
      {label}
      <div className="otp-row">
        <input
          name="otp"
          value={value}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="123456"
          inputMode="numeric"
          maxLength={6}
          autoComplete="one-time-code"
        />
        <button
          type="button"
          className="button button-secondary"
          disabled={disabled || requesting || cooldown > 0}
          onClick={async () => {
            setRequesting(true);
            try {
              await handleRequest();
            } catch (requestError) {
              const message = requestError instanceof Error ? requestError.message : 'We could not send the code.';
              onRequestError?.(message);
            } finally {
              setRequesting(false);
            }
          }}
        >
          {requesting ? 'Sending...' : cooldown > 0 ? `Resend (${cooldown}s)` : otpSent ? 'Resend code' : 'Send code'}
        </button>
      </div>
    </label>
  );
}
