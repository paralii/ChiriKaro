import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { TextField } from '@components/molecules/FormField';
import type { ClinicProfile } from '@shared/types';

export function ClinicProfileForm({ initial, busy, onSave, profileOnly = false, setupOnly = false }: { initial: ClinicProfile; busy: boolean; onSave: (values: ClinicProfile) => void; profileOnly?: boolean; setupOnly?: boolean }) {
  const [v, setV] = useState(initial);
  const [lastInitial, setLastInitial] = useState(initial);
  if (lastInitial !== initial) {
    setLastInitial(initial);
    setV(initial);
  }
  const bind = (field: keyof ClinicProfile) => ({
    value: (v[field] as string | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV((c) => ({ ...c, [field]: e.target.value })),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); onSave(v); };

  return (
    <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
      {!setupOnly ? <>
        <TextField label="Clinic name" {...bind('name')} minLength={2} maxLength={150} required disabled={busy} />
        {!profileOnly ? <TextField label="Clinic type" {...bind('clinicType')} placeholder="Dental clinic" maxLength={100} disabled={busy} /> : null}
        <TextField label="Contact email" type="email" {...bind('contactEmail')} maxLength={254} required disabled={busy} />
        <TextField label="Phone" type="tel" {...bind('phone')} pattern="[+]?[0-9 ()-]{7,25}" title="Enter a phone number with 7 to 15 digits. You may include a leading +, spaces, parentheses, or hyphens." disabled={busy} />
        <TextField label="Registration number" {...bind('registrationNumber')} maxLength={100} disabled={busy} />
      </> : null}
      <TextField label="Address" {...bind('address')} maxLength={250} disabled={busy} />
      <TextField label="City" {...bind('city')} maxLength={100} disabled={busy} />
      <TextField label="State" {...bind('state')} maxLength={100} disabled={busy} />
      <TextField label="Postal code" {...bind('pincode')} pattern="[0-9]{6}" title="Enter a 6-digit Indian PIN code." maxLength={6} disabled={busy} />
      {!setupOnly && !profileOnly ? <TextField label="About the clinic" {...bind('description')} maxLength={500} /> : null}
      <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : setupOnly ? 'Save location' : 'Save clinic profile'}</Button>
    </Form>
  );
}
