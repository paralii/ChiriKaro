import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/molecules/FormField';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { Notices } from '@/components/molecules/Notices';
import { useAction } from '@/hooks/useAction';
import { authService } from '@/services/authService';

export function ProfileForm({ name, email, roleLabel }: { name: string; email: string; roleLabel: string }) {
  const [value, setValue] = useState(name);
  const { busy, error, message, run } = useAction();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void run(() => authService.updateProfile(value), { success: (u) => `Profile updated for ${u.name}.`, fallback: 'Could not update profile.' });
  };

  return (
    <>
      <SectionHeading title="Personal information" description="Update the name shown across your workspace" />
      <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
        <Notices error={error} message={message} />
        <TextField label="Full name" value={value} onChange={(e) => setValue(e.target.value)} minLength={2} required />
        <TextField label="Email address" value={email} readOnly />
        <TextField label="Account type" value={roleLabel} readOnly />
        <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</Button>
      </Form>
    </>
  );
}