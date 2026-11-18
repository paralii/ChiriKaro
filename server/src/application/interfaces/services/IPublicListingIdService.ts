export interface PublicListingClaims {
  clinicId: string;
  doctorUserId: string;
}

export interface IPublicListingIdService {
  create(claims: PublicListingClaims): string;
  read(value: string): PublicListingClaims;
}
