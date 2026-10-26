import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Form } from '@/components/atoms/Form';
import { TextButton } from '@/components/atoms/TextLink';
import { TextField } from '@/components/molecules/FormField';
import { PasswordField } from '@/components/molecules/PasswordField';
import { OtpField } from '@/components/molecules/OtpField';
import { AuthSubmitButton } from '@/components/molecules/AuthSubmitButton';
import { Notices } from '@/components/molecules/Notices';
import { useAction } from '@/hooks/useAction';
import { useOtpStep } from '@/hooks/useOtpStep';
import { authService } from '@/services/authService';
import { clinicService } from '@/services/clinicService';
import { normalizeEmail, validateEmail } from '@/utils/validators';

export function ClinicRegisterForm({ onVerifyingChange }: { onVerifyingChange?: (v: boolean) => void }) {
  const [clinicName, setClinicName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const otp = useOtpStep(onVerifyingChange);
  const { busy, error, message, setError, setMessage, run } = useAction();

  function validateDetails() {
    if (clinicName.trim().length < 2) throw new Error('Clinic name must be at least 2 characters long.');
    if (name.trim().length < 2) throw new Error('Owner name must be at least 2 characters long.');
    if (!validateEmail(email)) throw new Error('A valid owner email is required.');
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
      await clinicService.register({ name: clinicName.trim(), ownerName: name.trim(), email: normalizeEmail(email), password, otp: otpCode.trim(), phone: phone.trim(), address: address.trim() });
      setSubmitted(true); setOtpCode(''); setPassword('');
    }, { success: 'Your clinic application has been submitted and is pending approval.', fallback: 'We could not complete that request. Please try again.' });
  };

  if (submitted) {
    return (<><Notices message={message} /><div className="mt-2"><Link to="/login/clinic" className="font-semibold text-brand-deep">Continue to sign in &#8594;</Link></div></>);
  }

  return (
    <>
      <Notices error={error} message={message} />
      <Form onSubmit={submit}>
        {!otp.verifying ? (
          <>
            <TextField label="Clinic name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Greenwood Dental Care" autoComplete="organization" required />
            <TextField label="Owner name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" minLength={2} required />
            <TextField label="Email address" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setOtpCode(''); }} placeholder="owner@clinic.com" autoComplete="email" required />
            <TextField label="Phone number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 80 1234 5678" />
            <TextField label="Clinic address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Area, city" />
            <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
          </>
        ) : (
          <>
            <p className="m-0 text-[13px] text-[#686d7b]">Verification code sent to <strong>{email}</strong></p>
            <OtpField email={email} value={otpCode} onChange={setOtpCode} onRequest={sendCode} onError={setError} disabled={busy} initiallySent initialCooldown={60} />
            <TextButton onClick={() => { otp.setVerifying(false); setError(''); }}>Edit clinic details</TextButton>
          </>
        )}
        <AuthSubmitButton busy={busy}>{otp.verifying ? 'Verify and submit application' : 'Continue to email verification'}</AuthSubmitButton>
      </Form>
    </>
  );
}