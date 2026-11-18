import type { PublicDirectoryListingDTO } from "@application/dto/search/public-directory.dto.ts";

export interface PublicDirectoryRepositoryQuery {
  query?: string;
  city?: string;
  specialization?: string;
  skip: number;
  limit: number;
}

export interface PublicDirectoryRepositoryPage {
  items: PublicDirectoryListingDTO[];
  totalItems: number;
}

export interface IPublicDirectoryRepository {
  search(query: PublicDirectoryRepositoryQuery): Promise<PublicDirectoryRepositoryPage>;
}
