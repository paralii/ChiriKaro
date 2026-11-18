import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import type { IQueueClinicContext } from "@application/interfaces/services/IQueueClinicContext.ts";
import type { Clinic } from "@domain/entities/clinic.entity.ts";
import type { Doctor } from "@domain/entities/doctor.entity.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { ClinicSetupStatus } from "@domain/enum/clinic-setup-status.enum.ts";
import { BadRequestError, ForbiddenError, NotFoundError } from "@shared/errors/index.ts";

export class QueueClinicContextService implements IQueueClinicContext {
  constructor(private readonly clinics: IClinicRepository, private readonly doctors: IDoctorRepository) {}

  async getOperationalClinic(clinicId: string): Promise<Clinic> {
    if (!/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Clinic scope is invalid");
    const clinic = await this.clinics.findById(clinicId);
    if (!clinic || clinic.status !== ClinicStatus.APPROVED || clinic.setupStatus !== ClinicSetupStatus.VERIFIED) {
      throw new ForbiddenError("Queue operations require a fully approved clinic");
    }
    return clinic;
  }

  async getVerifiedDoctor(clinicId: string, doctorUserId: string): Promise<Doctor> {
    if (!/^[a-f\d]{24}$/i.test(doctorUserId)) throw new BadRequestError("Doctor identity is invalid");
    const doctor = await this.doctors.findByUserId(doctorUserId);
    if (!doctor || doctor.clinicId !== clinicId || doctor.verificationStatus !== "VERIFIED") throw new NotFoundError("Verified doctor in this clinic");
    return doctor;
  }

  async listVerifiedDoctors(clinicId: string): Promise<Doctor[]> {
    const doctors = await this.doctors.findByClinicAndStatus(clinicId, "VERIFIED");
    return doctors.filter((doctor) => doctor.clinicId === clinicId);
  }

  localDate(now: Date, timeZone: string): string {
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now).map((part) => [part.type, part.value]));
      return `${parts.year}-${parts.month}-${parts.day}`;
    } catch { throw new BadRequestError("Clinic timezone is invalid"); }
  }
}
