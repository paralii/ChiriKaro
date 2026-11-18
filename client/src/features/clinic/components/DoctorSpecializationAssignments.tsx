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
    <div className="grid gap-3 border-b border-[#ececf1] py-4 last:border-b-0">
      <div>
        <p className="m-0 text-sm font-semibold text-[#242736]">{doctor.firstName} {doctor.lastName}</p>
        <p className="m-0 mt-1 text-xs text-[#777c8a]">{doctor.verificationStatus.replaceAll('_', ' ')}</p>
      </div>
      <fieldset className="flex flex-wrap gap-x-4 gap-y-2">
        <legend className="sr-only">Specializations for {doctor.firstName} {doctor.lastName}</legend>
        {choices.map((specialization) => (
          <label key={keyOf(specialization)} className="flex items-center gap-2 text-xs text-[#555a69]">
            <input
              type="checkbox"
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
  if (!doctors.length) return <p className="px-[18px] pb-5 text-sm text-[#777c8a]">No doctor profiles are linked to this clinic yet.</p>;
  return (
    <div className="px-[18px] pb-2">
      <p className="m-0 text-xs text-[#777c8a]">Reassign doctors before removing a specialization used by a doctor. At least one specialization is required per doctor.</p>
      {doctors.map((doctor) => (
        <DoctorAssignmentRow key={doctor.doctorId} doctor={doctor} options={clinicSpecializations} busy={busy}
          onSave={(specializations) => onSave(doctor.doctorId, specializations)} />
      ))}
    </div>
  );
}
