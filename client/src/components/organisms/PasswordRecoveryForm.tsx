import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/molecules/FormField';
import { PasswordField } from '@/components/molecules/PasswordField';
import { OtpField } from '@/components/molecules/OtpField';
import { AuthSubmitButton } from '@/components/molecules/AuthSubmitButton';
import { Notices } from '@/components/molecules/Notices';
import { useAction } from '@/hooks/useAction';
import { authService } from '@/services/authService';
import { normalizeEmail, validateEmail } from '@/utils/validators';

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { busy, error, message, setError, setMessage, run } = useAction();
  const navigate = useNavigate();

  async function requestOtp() {
    if (!validateEmail(email)) throw new Error('A valid email address is required.');
    await authService.requestOtp(normalizeEmail(email), 'password-reset');
    setMessage('A 6-digit verification code has been sent to your email.');
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!validateEmail(email)) throw new Error('A valid email address is required.');
      if (!otpCode.trim()) { await requestOtp(); return; }
      if (password.length < 8) throw new Error('Choose a password with at least 8 characters.');
      if (password !== confirm) throw new Error('The new password and confirmation do not match.');
      await authService.resetPassword({ email: normalizeEmail(email), otp: otpCode.trim(), password });
      setPassword(''); setConfirm(''); setOtpCode('');
      setMessage('Your password was reset successfully. You can sign in now.');
      setTimeout(() => navigate('/login/patient', { replace: true }), 900);
    }, { fallback: 'We could not reset your password. Please try again.' });
  };

  return (
    <>
      <Notices error={error} message={message} />
      <Form onSubmit={submit}>
        <TextField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
        <OtpField email={email} value={otpCode} onChange={setOtpCode} onRequest={requestOtp} onError={setError} disabled={busy} />
        <PasswordField label="New password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
        <TextField label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Enter your password again" autoComplete="new-password" minLength={8} required />
        <AuthSubmitButton busy={busy}>Reset password</AuthSubmitButton>
      </Form>
    </>
  );
}