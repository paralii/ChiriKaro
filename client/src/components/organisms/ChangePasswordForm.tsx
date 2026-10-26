import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { Notice } from '@/components/atoms/Notice';
import { TextButton } from '@/components/atoms/TextLink';
import { FormField, TextField } from '@/components/molecules/FormField';
import { Input } from '@/components/atoms/Input';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { Notices } from '@/components/molecules/Notices';
import { useAction } from '@/hooks/useAction';
import { useCooldown } from '@/hooks/useCooldown';
import { authService } from '@/services/authService';

export function ChangePasswordForm({ email }: { email: string }) {
  const [step, setStep] = useState<'current' | 'new'>('current');
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const { cooldown, start } = useCooldown();
  const { busy, error, message, setError, run } = useAction();

  const validateNew = () => {
    if (next.length < 8) throw new Error('Choose a new password with at least 8 characters.');
    if (next !== confirm) throw new Error('The new password and confirmation do not match.');
  };

  const requestOtp = () =>
    run(async () => {
      if (step !== 'new') throw new Error('Confirm your current password before requesting a verification code.');
      validateNew();
      await authService.requestOtp(email, 'profile-change');
      setOtpSent(true); setOtp(''); start(60);
    }, { success: `A password-change code was sent to ${email}. It expires in 10 minutes.`, fallback: 'Could not send verification code.' });

  const back = () => { setStep('current'); setOtpSent(false); setOtp(''); start(0); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (step === 'current') {
        if (!current) throw new Error('Enter your current password to continue.');
        await authService.verifyCurrentPassword(current);
        setStep('new');
        return;
      }
      validateNew();
      if (!otpSent) throw new Error('Request the email verification code before changing your password.');
      if (!/^\d{6}$/.test(otp.trim())) throw new Error('Enter the 6-digit code sent to your email.');
      await authService.changePassword({ currentPassword: current, newPassword: next, otp: otp.trim() });
      setCurrent(''); setNext(''); setConfirm(''); setOtp(''); setOtpSent(false); start(0); setStep('current');
    }, { success: (r) => (r === undefined && step === 'current' ? 'Current password confirmed. Choose a new password and request an email code.' : 'Password changed successfully.'), fallback: 'Could not update password.' });
  };

  return (
    <>
      <SectionHeading title="Security" description={step === 'current' ? 'Confirm your current password to begin.' : 'Choose a new password, then verify the change by email.'} />
      <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
        <Notices error={error} message={message} />
        {step === 'current' ? (
          <>
            <TextField label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Enter your current password" autoComplete="current-password" required />
            <Button className="justify-self-start" disabled={busy}>{busy ? 'Checking...' : 'Continue'}</Button>
          </>
        ) : (
          <>
            <Notice tone="success" className="mb-0">Current password confirmed</Notice>
            <TextField label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
            <TextField label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Enter the new password again" autoComplete="new-password" minLength={8} required />
            <div className="flex items-end gap-2.5">
              <FormField label="Email verification code" className="grow">
                <Input value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" maxLength={6} required />
              </FormField>
              <Button type="button" variant="secondary" disabled={cooldown > 0 || busy} onClick={() => void requestOtp()}>
                {cooldown > 0 ? `Resend (${cooldown}s)` : otpSent ? 'Resend code' : 'Send code'}
              </Button>
            </div>
            <div className="flex items-center gap-2.5">
              <TextButton disabled={busy} onClick={() => { back(); setError(''); }}>Back</TextButton>
              <Button disabled={busy || !otpSent}>{busy ? 'Updating...' : 'Verify and change password'}</Button>
            </div>
          </>
        )}
      </Form>
    </>
  );
}