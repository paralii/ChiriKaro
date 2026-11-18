import { WorkingHoursForm } from '@/features/clinic/components/WorkingHoursForm';
import { toDisplayWorkingHours } from '@/shared/utils/doctor';
import type { ClinicDoctorSchedule, WorkingHour } from '@/shared/types';

export function ClinicDoctorWorkingHours({ doctors, busy, onSave }: {
  doctors: ClinicDoctorSchedule[];
  busy: boolean;
  onSave: (doctorId: string, workingHours: WorkingHour[]) => void;
}) {
  if (!doctors.length) return <p className="px-[18px] pb-5 text-sm text-[#777c8a]">No doctor profiles are linked to this clinic yet.</p>;

  return (
    <div className="grid gap-4 px-[18px] pb-5">
      {doctors.map((doctor) => (
        <div key={doctor.doctorId} className="rounded-lg border border-[#ececf1]">
          <div className="px-[18px] pt-4">
            <p className="m-0 text-sm font-semibold text-[#242736]">{doctor.firstName} {doctor.lastName}</p>
            <p className="m-0 mt-1 text-xs text-[#777c8a]">{doctor.verificationStatus.replaceAll('_', ' ')}</p>
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
