import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form } from '@components/atoms/Form';
import { TextField } from '@components/molecules/FormField';
import { PasswordField } from '@components/molecules/PasswordField';
import { AuthSubmitButton } from '@components/molecules/AuthSubmitButton';
import { Notices } from '@components/molecules/Notices';
import { useAction } from '@shared/hooks/useAction';
import { invitationService } from '@/features/auth/services/invitationService';
import { validateEmail } from '@shared/utils/validators';
import type { InvitationValidation } from '@/shared/types';

export function InvitationAcceptForm({ onLoaded }: { onLoaded?: (role: string) => void }) {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<InvitationValidation | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { busy, error, message, run } = useAction();
  const tokenError = token ? '' : 'This invitation link is missing its token. Ask the clinic to send a new invitation.';

  useEffect(() => {
    if (!token) return;
    void run(async () => {
      const payload = await invitationService.validate(token);
      setInvitation(payload);
      onLoaded?.(payload.role);
    }, { fallback: 'This invitation could not be loaded.' });
  }, [token, run, onLoaded]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!token) throw new Error(tokenError);
      if (!invitation?.email || !validateEmail(invitation.email)) throw new Error('A valid email address is required.');
      if (name.trim().length < 2) throw new Error('Please enter your full name.');
      if (password.length < 8) throw new Error('Choose a password with at least 8 characters.');
      if (password !== confirm) throw new Error('The password and confirmation do not match.');
      await invitationService.accept({ token, name: name.trim(), password });
      setTimeout(() => navigate(invitation.role.toUpperCase() === 'DOCTOR' ? '/login/doctor' : '/login/staff', { replace: true }), 900);
    }, { success: 'Your account is ready. Sign in to your role portal to continue.', fallback: 'We could not accept this invitation. Please try again.' });
  };

  return (
    <>
      <Notices error={tokenError || error} message={message} />
      <Form onSubmit={submit}>
        {invitation ? (
          <>
            <p className="m-0 text-[13px] text-[#686d7b]">You were invited to join <strong>{invitation.clinicName}</strong> as a {invitation.role === 'DOCTOR' ? 'doctor' : 'staff member'}.</p>
            <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" minLength={2} required />
            <TextField label="Email address" type="email" value={invitation.email} readOnly />
            <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
            <TextField label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Enter your password again" autoComplete="new-password" minLength={8} required />
            <AuthSubmitButton busy={busy}>Create account</AuthSubmitButton>
          </>
        ) : busy && !tokenError ? <p className="m-0 text-[13px] text-[#686d7b]">Checking invitation...</p> : null}
      </Form>
    </>
  );
}
