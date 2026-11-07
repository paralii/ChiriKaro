import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { Select } from '@components/atoms/Select';
import { FormField, TextField } from '@components/molecules/FormField';
import type { DoctorGender, DoctorOnboardingProfile } from '@shared/types';

export function DoctorBasicForm({ initial, busy, onSave }: {
  initial: DoctorOnboardingProfile;
  busy: boolean;
  onSave: (values: Pick<DoctorOnboardingProfile, 'firstName' | 'lastName' | 'gender' | 'dateOfBirth'>) => void;
}) {
  const [values, setValues] = useState(initial);
  const patch = (change: Partial<DoctorOnboardingProfile>) => setValues((current) => ({ ...current, ...change }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ firstName: values.firstName, lastName: values.lastName, gender: values.gender, dateOfBirth: values.dateOfBirth });
  };

  return (
    <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
      <TextField label="First name" value={values.firstName} onChange={(event) => patch({ firstName: event.target.value })} minLength={2} maxLength={100} required />
      <TextField label="Last name" value={values.lastName} onChange={(event) => patch({ lastName: event.target.value })} minLength={2} maxLength={100} required />
      <FormField label="Gender">
        <Select value={values.gender ?? ''} onChange={(event) => patch({ gender: (event.target.value || null) as DoctorGender | null })}>
          <option value="">Choose if you wish</option>
          <option value="MALE">Male</option><option value="FEMALE">Female</option>
          <option value="OTHER">Other</option><option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
        </Select>
      </FormField>
      <TextField label="Date of birth" type="date" value={values.dateOfBirth?.slice(0, 10) ?? ''} max={new Date().toISOString().slice(0, 10)} onChange={(event) => patch({ dateOfBirth: event.target.value || null })} />
      <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save and continue'}</Button>
    </Form>
  );
}
