import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { TextField } from '@components/molecules/FormField';
import type { ClinicProfile } from '@shared/types';

export function ClinicProfileForm({ initial, busy, onSave, profileOnly = false }: { initial: ClinicProfile; busy: boolean; onSave: (values: ClinicProfile) => void; profileOnly?: boolean }) {
  const [v, setV] = useState(initial);
  const bind = (field: keyof ClinicProfile) => ({
    value: (v[field] as string | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV((c) => ({ ...c, [field]: e.target.value })),
  });
  const submit = (e: FormEvent) => { e.preventDefault(); onSave(v); };

  return (
    <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
      <TextField label="Clinic name" {...bind('name')} minLength={2} maxLength={150} required />
      {!profileOnly ? <TextField label="Clinic type" {...bind('clinicType')} placeholder="Dental clinic" /> : null}
      <TextField label="Contact email" type="email" {...bind('contactEmail')} required />
      <TextField label="Phone" type="tel" {...bind('phone')} pattern="[+0-9 ()-]{7,20}" title="Enter a valid phone number." />
      <TextField label="Registration number" {...bind('registrationNumber')} />
      <TextField label="Address" {...bind('address')} />
      <TextField label="City" {...bind('city')} />
      <TextField label="State" {...bind('state')} />
      <TextField label="Postal code" {...bind('pincode')} pattern="[A-Za-z0-9 -]{3,12}" title="Enter a valid postal code." />
      {!profileOnly ? <TextField label="About the clinic" {...bind('description')} maxLength={500} /> : null}
      <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save clinic profile'}</Button>
    </Form>
  );
}
