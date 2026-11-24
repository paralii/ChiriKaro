import type { IDoctorRepository } from "@application/interfaces/repositories/IDoctorRepository.ts";
import { BadRequestError, NotFoundError } from "@shared/errors/index.ts";

export async function getDoctorForLeave(doctors: IDoctorRepository, userId: string, clinicId: string) {
  if (!/^[a-f\d]{24}$/i.test(userId) || !/^[a-f\d]{24}$/i.test(clinicId)) throw new BadRequestError("Doctor or clinic id is invalid");
  const doctor = await doctors.findByUserIdAndClinic(userId, clinicId);
  if (!doctor) throw new NotFoundError("Doctor profile");
  return doctor;
}
