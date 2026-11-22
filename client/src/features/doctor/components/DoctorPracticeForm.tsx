import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { TextField } from '@components/molecules/FormField';
import { parseList } from '@shared/utils/doctor';
import type { DoctorOnboardingProfile } from '@shared/types';

export function DoctorPracticeForm({ initial, busy, clinicSpecializations, onSave }: {
  initial: DoctorOnboardingProfile;
  busy: boolean;
  clinicSpecializations: string[];
  onSave: (values: Pick<DoctorOnboardingProfile, 'specializations' | 'procedures'>) => void;
}) {
  const [specializations, setSpecializations] = useState(initial.specializations);
  const [procedures, setProcedures] = useState(initial.procedures.join(', '));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ specializations, procedures: parseList(procedures) });
  };

  return (
    <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
      <fieldset className="grid gap-2"><legend className="text-xs font-semibold text-[#656a79]">Clinic specializations</legend>{clinicSpecializations.length ? clinicSpecializations.map((item) => <label key={item} className="flex items-center gap-2 text-xs"><input type="checkbox" checked={specializations.some((value) => value.toLocaleLowerCase() === item.toLocaleLowerCase())} onChange={(event) => setSpecializations((current) => event.target.checked ? [...current.filter((value) => value.toLocaleLowerCase() !== item.toLocaleLowerCase()), item] : current.filter((value) => value.toLocaleLowerCase() !== item.toLocaleLowerCase()))} />{item}</label>) : <p className="text-xs text-[#777b89]">Your clinic has not added specializations yet. Ask your Clinic Admin to configure them.</p>}</fieldset>
      <TextField label="Procedures, separated by commas" value={procedures} onChange={(event) => setProcedures(event.target.value)} placeholder="Root canal, Dental crowns" maxLength={2040} required />
      <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save practice details'}</Button>
    </Form>
  );
}
