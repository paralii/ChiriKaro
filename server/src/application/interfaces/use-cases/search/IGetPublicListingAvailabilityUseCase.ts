import type { DatedDoctorAvailabilityDTO } from "@application/dto/doctor/doctor-availability.dto.ts";

export interface IGetPublicListingAvailabilityUseCase {
  execute(listingId: string, date: string): Promise<DatedDoctorAvailabilityDTO>;
}
