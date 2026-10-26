import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/molecules/FormField';
import { PasswordField } from '@/components/molecules/PasswordField';
import { AuthSubmitButton } from '@/components/molecules/AuthSubmitButton';
import { Notices } from '@/components/molecules/Notices';
import { useAction } from '@/hooks/useAction';
import { authService } from '@/services/authService';
import { validateEmail } from '@/utils/validators';

export function InvitationAcceptForm({ onLoaded }: { onLoaded?: (role: string) => void }) {
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [invitation, setInvitation] = useState<{ email: string; role: string } | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { busy, error, message, run } = useAction();
  const tokenError = token ? '' : 'This invitation link is missing its token. Ask the clinic to send a new invitation.';

  useEffect(() => {
    if (!token) return;
    void run(async () => {
      const payload = await authService.getInvitation(token);
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
      await authService.acceptInvitation({ token, name: name.trim(), password });
      setTimeout(() => navigate(invitation.role.toUpperCase() === 'DOCTOR' ? '/login/doctor' : '/login/staff', { replace: true }), 900);
    }, { success: 'Your account is ready. Sign in to your role portal to continue.', fallback: 'We could not accept this invitation. Please try again.' });
  };

  return (
    <>
      <Notices error={tokenError || error} message={message} />
      <Form onSubmit={submit}>
        <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" autoComplete="name" minLength={2} required />
        <TextField label="Email address" type="email" value={invitation?.email ?? ''} readOnly />
        <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
        <TextField label="Confirm password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Enter your password again" autoComplete="new-password" minLength={8} required />
        <AuthSubmitButton busy={busy}>Create account</AuthSubmitButton>
      </Form>
    </>
  );
}