import { useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/molecules/FormField';
import { parseList } from '@/utils/doctor';
import type { DoctorProfile } from '@/types';

export function DoctorProfessionalForm({ initial, busy, onSave }: { initial: DoctorProfile; busy: boolean; onSave: (values: DoctorProfile) => void }) {
  const [p, setP] = useState(initial);
  const [spec, setSpec] = useState(initial.specializations.join(', '));
  const [proc, setProc] = useState(initial.procedures.join(', '));
  const bind = (field: keyof DoctorProfile) => ({
    value: (p[field] as string | null) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setP((c) => ({ ...c, [field]: e.target.value })),
  });
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ ...p, specializations: parseList(spec), procedures: parseList(proc) });
  };

  return (
    <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
      <TextField label="First name" {...bind('firstName')} minLength={2} required />
      <TextField label="Last name" {...bind('lastName')} minLength={2} required />
      <TextField label="Phone" type="tel" {...bind('phone')} pattern="\+?[0-9 ()-]{7,20}" required />
      <TextField label="Professional title" {...bind('professionalTitle')} required />
      <TextField label="Qualification" {...bind('qualification')} required />
      <TextField label="Years of experience" type="number" min="0" max="70" value={p.yearsOfExperience ?? ''}
        onChange={(e) => setP((c) => ({ ...c, yearsOfExperience: e.target.value === '' ? null : Number(e.target.value) }))} />
      <TextField label="Registration number" {...bind('registrationNumber')} required />
      <TextField label="Registration authority" {...bind('registrationAuthority')} />
      <TextField label="Specializations" value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="Orthodontics, Endodontics" required />
      <TextField label="Procedures" value={proc} onChange={(e) => setProc(e.target.value)} placeholder="Root canal, Dental crowns" required />
      <TextField label="Professional bio" {...bind('bio')} maxLength={1200} />
      <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save and continue'}</Button>
    </Form>
  );
}