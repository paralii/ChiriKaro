import { WorkingHoursForm } from '@/features/clinic/components/WorkingHoursForm';
import { toDisplayWorkingHours } from '@/shared/utils/doctor';
import type { ClinicDoctorSchedule, WorkingHour } from '@/shared/types';

export function ClinicDoctorWorkingHours({ doctors, busy, onSave }: {
  doctors: ClinicDoctorSchedule[];
  busy: boolean;
  onSave: (doctorId: string, workingHours: WorkingHour[]) => void;
}) {
  if (!doctors.length) return <p className="px-4 pb-5 text-sm text-text-muted sm:px-5">No doctor profiles are linked to this clinic yet.</p>;

  return (
    <div className="grid gap-4 px-4 pb-5 sm:px-5">
      {doctors.map((doctor) => (
        <div key={doctor.doctorId} className="rounded-lg border border-border bg-surface-elevated">
          <div className="px-4 pt-4 sm:px-5">
            <p className="m-0 text-base font-semibold text-text-primary">{doctor.firstName} {doctor.lastName}</p>
            <p className="m-0 mt-1 text-sm text-text-muted">{doctor.verificationStatus.replaceAll('_', ' ')}</p>
          </div>
          <WorkingHoursForm
            initial={toDisplayWorkingHours(doctor.workingHours)}
            busy={busy}
            onSave={(hours) => onSave(doctor.doctorId, hours)}
            submitLabel="Save doctor hours"
          />
        </div>
      ))}
    </div>
  );
}
