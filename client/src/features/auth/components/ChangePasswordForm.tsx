import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { Input } from '@components/atoms/Input';
import { SectionHeading } from '@components/molecules/SectionHeading';
import { Notices } from '@components/molecules/Notices';
import { useAction } from '@shared/hooks/useAction';
import { authService } from '@/features/auth/services/authService';
import { useAppSelector } from '@/store/hooks';
import { validatePassword } from '@shared/utils/validators';

function PasswordField({ id, label, value, onChange, placeholder, autoComplete, visible, onToggle, minLength, maxLength, title }: {
  id: string; label: string; value: string; onChange: (value: string) => void; placeholder: string; autoComplete: string;
  visible: boolean; onToggle: () => void; minLength?: number; maxLength?: number; title?: string;
}) {
  return <div className="grid gap-2 text-sm font-medium text-text-secondary">
    <label htmlFor={id}>{label}</label>
    <div className="flex gap-2">
      <Input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete={autoComplete} minLength={minLength} maxLength={maxLength} title={title} required />
      <button type="button" aria-controls={id} aria-pressed={visible} onClick={onToggle} className="min-h-11 shrink-0 rounded-md border border-border px-3 text-sm font-semibold text-text-secondary hover:bg-page focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{visible ? 'Hide' : 'Show'}</button>
    </div>
  </div>;
}

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const userId = useAppSelector((state) => state.auth.user?.id ?? '');
  const { busy, error, message, run } = useAction();

  const validateNew = () => {
    if (!validatePassword(next)) throw new Error('Use 8–128 characters with an uppercase letter, a number, and a special character. Spaces are not allowed.');
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
        <PasswordField id="current-password" label="Current password" value={current} onChange={setCurrent} placeholder="Enter your current password" autoComplete="current-password" visible={showCurrent} onToggle={() => setShowCurrent((shown) => !shown)} />
        <PasswordField id="new-password" label="New password" value={next} onChange={setNext} placeholder="8+ characters, uppercase, number, symbol" autoComplete="new-password" visible={showNext} onToggle={() => setShowNext((shown) => !shown)} minLength={8} maxLength={128} title="Use 8–128 characters with an uppercase letter, a number, and a special character. Spaces are not allowed." />
        <PasswordField id="confirm-new-password" label="Confirm new password" value={confirm} onChange={setConfirm} placeholder="Enter the new password again" autoComplete="new-password" visible={showConfirm} onToggle={() => setShowConfirm((shown) => !shown)} maxLength={128} />
        <Button className="justify-self-start" disabled={busy}>{busy ? 'Updating...' : 'Change password'}</Button>
      </Form>
    </>
  );
}
