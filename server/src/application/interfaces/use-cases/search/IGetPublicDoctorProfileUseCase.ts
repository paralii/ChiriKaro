import type { PublicDoctorProfileDTO } from "@application/dto/search/public-profile.dto.ts";

export interface IGetPublicDoctorProfileUseCase {
  execute(listingId: string): Promise<PublicDoctorProfileDTO>;
}
