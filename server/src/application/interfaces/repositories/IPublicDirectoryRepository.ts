import type { PublicDirectoryListingDTO } from "@application/dto/search/public-directory.dto.ts";
import type { PublicListingClaims } from "@application/interfaces/services/IPublicListingIdService.ts";

export interface PublicDirectoryCandidateDTO extends Omit<PublicDirectoryListingDTO, "listingId">, PublicListingClaims {}

export interface PublicDirectoryRepositoryQuery {
  query?: string;
  city?: string;
  specialization?: string;
  skip: number;
  limit: number;
}

export interface PublicDirectoryRepositoryPage {
  items: PublicDirectoryCandidateDTO[];
  totalItems: number;
}

export interface IPublicDirectoryRepository {
  search(query: PublicDirectoryRepositoryQuery): Promise<PublicDirectoryRepositoryPage>;
}
