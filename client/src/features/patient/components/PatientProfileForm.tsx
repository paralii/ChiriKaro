import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { Input } from '@/components/atoms/Input';
import { TextField } from '@/components/molecules/FormField';

export function PatientProfileForm({ name, email, avatar: initialAvatar, busy, onSave }: {
  name: string; email: string; avatar?: string | null; busy: boolean; onSave: (name: string, avatar: string | null) => void;
}) {
  const [value, setValue] = useState(name);
  const [avatar, setAvatar] = useState(initialAvatar ?? '');

  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave(value, avatar.trim() || null);
  };

  return (
    <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
      <TextField label="Full name" value={value} onChange={(event) => setValue(event.target.value)} minLength={2} maxLength={100} required />
      <TextField label="Email address" type="email" value={email} readOnly />
      <label className="grid gap-2 text-sm font-medium text-text-secondary" htmlFor="patient-avatar-url">Profile image URL <span className="text-xs font-normal text-text-muted">Optional; hosted image uploads are not available for patient profiles.</span></label>
      <Input id="patient-avatar-url" type="text" inputMode="url" autoComplete="url" value={avatar} maxLength={2048} onChange={(event) => setAvatar(event.target.value)} placeholder="https://example.com/profile-image.jpg" />
      {avatar.trim() ? <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-3">
        <img src={avatar.trim()} alt="Profile image preview" className="size-14 rounded-full border border-border object-cover" />
        <span className="text-xs text-text-muted">Preview</span>
      </div> : null}
      <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save profile'}</Button>
    </Form>
  );
}
