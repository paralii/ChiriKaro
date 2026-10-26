import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form } from '@/components/atoms/Form';
import { TextButton } from '@/components/atoms/TextLink';
import { TextField } from '@/components/molecules/FormField';
import { PasswordField } from '@/components/molecules/PasswordField';
import { OtpField } from '@/components/molecules/OtpField';
import { AuthSubmitButton } from '@/components/molecules/AuthSubmitButton';
import { Notices } from '@/components/molecules/Notices';
import { useAction } from '@/hooks/useAction';
import { useOtpStep } from '@/hooks/useOtpStep';
import { useAppDispatch } from '@/store/hooks';
import { normalizeRole, setAuthSession, setUser } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';
import { normalizeEmail, validateEmail } from '@/utils/validators';

export function PatientRegisterForm({ onVerifyingChange }: { onVerifyingChange?: (v: boolean) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const otp = useOtpStep(onVerifyingChange);
  const { busy, error, message, setError, setMessage, run } = useAction();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  function validateDetails() {
    if (name.trim().length < 2) throw new Error('Name must be at least 2 characters long.');
    if (!validateEmail(email)) throw new Error('A valid email address is required.');
    if (password.length < 8) throw new Error('Choose a password with at least 8 characters.');
  }

  async function sendCode() {
    validateDetails();
    await authService.requestOtp(normalizeEmail(email), 'register');
    otp.markRequested(email);
    setMessage('A 6-digit verification code has been sent to your email.');
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      validateDetails();
      if (!otp.verifying) {
        if (!otp.hasRequestedFor(email)) await sendCode();
        otp.setVerifying(true);
        return;
      }
      if (!/^\d{6}$/.test(otpCode.trim())) throw new Error('Enter the 6-digit code sent to your email.');
      const result = await authService.register({ name: name.trim(), email: normalizeEmail(email), password, otp: otpCode.trim() });
      dispatch(setUser({ ...result.user, role: normalizeRole(result.user.role) }));
      dispatch(setAuthSession({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      navigate('/app/dashboard', { replace: true });
    }, { fallback: 'We could not complete that request. Please try again.' });
  };

  return (
    <>
      <Notices error={error} message={message} />
      <Form onSubmit={submit}>
        {!otp.verifying ? (
          <>
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" minLength={2} required />
            <TextField label="Email address" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setOtpCode(''); }} placeholder="you@example.com" autoComplete="email" required />
            <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
          </>
        ) : (
          <>
            <p className="m-0 text-[13px] text-[#686d7b]">Verification code sent to <strong>{email}</strong></p>
            <OtpField email={email} value={otpCode} onChange={setOtpCode} onRequest={sendCode} onError={setError} disabled={busy} initiallySent initialCooldown={60} />
            <TextButton onClick={() => { otp.setVerifying(false); setError(''); }}>Edit registration details</TextButton>
          </>
        )}
        <AuthSubmitButton busy={busy}>{otp.verifying ? 'Verify and create account' : 'Continue to email verification'}</AuthSubmitButton>
      </Form>
    </>
  );
}