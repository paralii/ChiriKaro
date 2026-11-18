import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/molecules/FormField';

export function PatientProfileForm({ name, email, avatar: initialAvatar, busy, onSave }: {
  name: string; email: string; avatar?: string | null; busy: boolean; onSave: (name: string, avatar: string) => void;
}) {
  const [value, setValue] = useState(name);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(value, initialAvatar ?? '');
  };

  return (
    <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
      <TextField label="Full name" value={value} onChange={(event) => setValue(event.target.value)} minLength={2} maxLength={100} required />
      <TextField label="Email address" type="email" value={email} readOnly />
      <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</Button>
    </Form>
  );
}
