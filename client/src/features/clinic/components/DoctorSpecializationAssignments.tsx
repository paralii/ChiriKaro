import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import type { ClinicDoctorSpecialization } from '@/shared/types';

const keyOf = (value: string) => value.trim().toLocaleLowerCase();

function DoctorAssignmentRow({ doctor, options, busy, onSave }: {
  doctor: ClinicDoctorSpecialization;
  options: string[];
  busy: boolean;
  onSave: (specializations: string[]) => void;
}) {
  const [selected, setSelected] = useState(doctor.specializations);
  const choices = [...doctor.specializations, ...options].filter((value, index, values) =>
    values.findIndex((candidate) => keyOf(candidate) === keyOf(value)) === index);
  const changed = selected.length !== doctor.specializations.length || selected.some((value, index) => keyOf(value) !== keyOf(doctor.specializations[index] ?? ''));

  return (
    <div className="grid gap-4 border-b border-border py-4 last:border-b-0">
      <div>
        <p className="m-0 text-sm font-semibold text-text-primary">{doctor.firstName} {doctor.lastName}</p>
        <p className="m-0 mt-1 text-sm text-text-muted">{doctor.verificationStatus.replaceAll('_', ' ')}</p>
      </div>
      <fieldset className="flex flex-wrap gap-x-5 gap-y-3">
        <legend className="sr-only">Specializations for {doctor.firstName} {doctor.lastName}</legend>
        {choices.map((specialization) => (
          <label key={keyOf(specialization)} className="flex min-h-8 cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              className="size-4 shrink-0 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              checked={selected.some((value) => keyOf(value) === keyOf(specialization))}
              disabled={busy}
              onChange={(event) => setSelected((current) => event.target.checked
                ? [...current, specialization]
                : current.filter((value) => keyOf(value) !== keyOf(specialization)))}
            />
            {specialization}{options.some((option) => keyOf(option) === keyOf(specialization)) ? '' : ' (no longer offered)'}
          </label>
        ))}
      </fieldset>
      <div><Button type="button" disabled={busy || !changed || selected.length === 0} onClick={() => onSave(selected)}>{busy ? 'Saving...' : 'Save assignments'}</Button></div>
    </div>
  );
}

export function DoctorSpecializationAssignments({ doctors, clinicSpecializations, busy, onSave }: {
  doctors: ClinicDoctorSpecialization[];
  clinicSpecializations: string[];
  busy: boolean;
  onSave: (doctorId: string, specializations: string[]) => void;
}) {
  if (!doctors.length) return <p className="px-4 pb-5 text-sm text-text-muted sm:px-5">No doctor profiles are linked to this clinic yet.</p>;
  return (
    <div className="px-4 pb-2 sm:px-5">
      <p className="m-0 text-sm leading-relaxed text-text-secondary">Reassign doctors before removing a specialization used by a doctor. At least one specialization is required per doctor.</p>
      {doctors.map((doctor) => (
        <DoctorAssignmentRow key={doctor.doctorId} doctor={doctor} options={clinicSpecializations} busy={busy}
          onSave={(specializations) => onSave(doctor.doctorId, specializations)} />
      ))}
    </div>
  );
}
