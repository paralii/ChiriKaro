import { useState, type FormEvent } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { TextField } from '@components/molecules/FormField';
import { parseList } from '@shared/utils/doctor';
import type { DoctorOnboardingProfile } from '@shared/types';

export function DoctorProfessionalForm({ initial, busy, onSave }: {
  initial: DoctorOnboardingProfile;
  busy: boolean;
  onSave: (values: Pick<DoctorOnboardingProfile, 'professionalTitle' | 'qualifications' | 'yearsOfExperience' | 'registrationNumber' | 'registrationAuthority'>) => void;
}) {
  const [profile, setProfile] = useState(initial);
  const [qualifications, setQualifications] = useState(initial.qualifications.join(', '));
  const bind = (field: 'professionalTitle' | 'registrationNumber' | 'registrationAuthority') => ({
    value: profile[field] ?? '',
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => setProfile((current) => ({ ...current, [field]: event.target.value })),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      professionalTitle: profile.professionalTitle,
      qualifications: parseList(qualifications),
      yearsOfExperience: profile.yearsOfExperience,
      registrationNumber: profile.registrationNumber,
      registrationAuthority: profile.registrationAuthority,
    });
  };

  return (
    <Form onSubmit={submit} className="max-w-[520px] p-[18px]">
      <TextField label="Professional title" {...bind('professionalTitle')} required />
      <TextField label="Qualifications, separated by commas" value={qualifications} onChange={(event) => setQualifications(event.target.value)} placeholder="DDS, Orthodontics certification" required />
      <TextField label="Years of experience" type="number" min="0" max="80" value={profile.yearsOfExperience ?? ''}
        onChange={(event) => setProfile((current) => ({ ...current, yearsOfExperience: event.target.value === '' ? null : Number(event.target.value) }))} required />
      <TextField label="Registration number" {...bind('registrationNumber')} required />
      <TextField label="Registration authority" {...bind('registrationAuthority')} required />
      <Button className="mt-[3px] justify-self-start" disabled={busy}>{busy ? 'Saving...' : 'Save and continue'}</Button>
    </Form>
  );
}
