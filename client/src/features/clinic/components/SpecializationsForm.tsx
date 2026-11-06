import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/molecules/FormField';

export function SpecializationsForm({ initial, busy, onSave }: { initial: string[]; busy: boolean; onSave: (text: string) => void }) {
  const [text, setText] = useState(initial.join(', '));
  const submit = (e: FormEvent) => { e.preventDefault(); onSave(text); };
  return (
    <Form onSubmit={submit} className="grid-cols-[1fr_auto] items-end p-[19px] max-md:grid-cols-1">
      <TextField label="Specializations, separated by commas" value={text} onChange={(e) => setText(e.target.value)} placeholder="General dentistry, Orthodontics" />
      <Button className="min-w-[155px] max-md:w-full" disabled={busy}>{busy ? 'Saving...' : 'Save specializations'}</Button>
    </Form>
  );
}