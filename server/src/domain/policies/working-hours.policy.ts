import type { ClinicWorkingHour } from "@domain/entities/clinic.entity.ts";
import type { DoctorWorkingHour } from "@domain/entities/doctor.entity.ts";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function findWorkingHoursOutsideClinic(
  doctorHours: readonly DoctorWorkingHour[],
  clinicHours: readonly ClinicWorkingHour[],
): DoctorWorkingHour | undefined {
  return doctorHours.find((doctorHour) => {
    if (!doctorHour.isOpen) return false;
    if (!TIME.test(doctorHour.startTime) || !TIME.test(doctorHour.endTime) || doctorHour.startTime >= doctorHour.endTime) return true;
    const clinicHour = clinicHours.find((hour) =>
      typeof hour?.day === "string" && hour.day.trim().toUpperCase() === doctorHour.day
    );
    return !clinicHour?.isOpen ||
      !TIME.test(clinicHour.startTime) ||
      !TIME.test(clinicHour.endTime) ||
      clinicHour.startTime >= clinicHour.endTime ||
      doctorHour.startTime < clinicHour.startTime ||
      doctorHour.endTime > clinicHour.endTime;
  });
}
