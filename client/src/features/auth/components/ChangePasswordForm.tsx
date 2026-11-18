import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { TextField } from '@components/molecules/FormField';
import { SectionHeading } from '@components/molecules/SectionHeading';
import { Notices } from '@components/molecules/Notices';
import { useAction } from '@shared/hooks/useAction';
import { authService } from '@/features/auth/services/authService';
import { useAppSelector } from '@/store/hooks';

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const userId = useAppSelector((state) => state.auth.user?.id ?? '');
  const { busy, error, message, run } = useAction();

  const validateNew = () => {
    if (next.length < 8) throw new Error('Choose a new password with at least 8 characters.');
    if (next !== confirm) throw new Error('The new password and confirmation do not match.');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      validateNew();
      if (!userId) throw new Error('Your signed-in account could not be identified.');
      await authService.changePassword({ userId, currentPassword: current, newPassword: next });
      setCurrent(''); setNext(''); setConfirm('');
    }, { success: 'Password changed successfully.', fallback: 'Could not update password.' });
  };

  return (
    <>
      <SectionHeading title="Security" description="Confirm your current password before choosing a new one." />
      <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
        <Notices error={error} message={message} />
        <TextField label="Current password" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Enter your current password" autoComplete="current-password" required />
        <TextField label="New password" type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
        <TextField label="Confirm new password" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Enter the new password again" autoComplete="new-password" minLength={8} required />
        <Button className="justify-self-start" disabled={busy}>{busy ? 'Updating...' : 'Change password'}</Button>
      </Form>
    </>
  );
}
