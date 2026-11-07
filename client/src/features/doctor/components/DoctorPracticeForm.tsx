import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { TextField } from '@components/molecules/FormField';
import { parseList } from '@shared/utils/doctor';
import type { DoctorOnboardingProfile } from '@shared/types';

export function DoctorPracticeForm({ initial, busy, onSave }: {
  initial: DoctorOnboardingProfile;
  busy: boolean;
  onSave: (values: Pick<DoctorOnboardingProfile, 'specializations' | 'procedures'>) => void;
}) {
  const [specializations, setSpecializations] = useState(initial.specializations.join(', '));
  const [procedures, setProcedures] = useState(initial.procedures.join(', '));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ specializations: parseList(specializations), procedures: parseList(procedures) });
  };

  return (
    <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
      <TextField label="Specializations, separated by commas" value={specializations} onChange={(event) => setSpecializations(event.target.value)} placeholder="Orthodontics, Endodontics" required />
      <TextField label="Procedures, separated by commas" value={procedures} onChange={(event) => setProcedures(event.target.value)} placeholder="Root canal, Dental crowns" required />
      <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save practice details'}</Button>
    </Form>
  );
}
