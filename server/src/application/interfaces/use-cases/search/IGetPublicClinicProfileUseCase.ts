import type { PublicClinicProfileDTO } from "@application/dto/search/public-profile.dto.ts";

export interface IGetPublicClinicProfileUseCase {
  execute(listingId: string): Promise<PublicClinicProfileDTO>;
}
