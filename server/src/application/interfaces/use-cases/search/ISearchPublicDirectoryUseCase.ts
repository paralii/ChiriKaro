import type { PublicDirectorySearchInput, PublicDirectorySearchResultDTO } from "@application/dto/search/public-directory.dto.ts";

export interface ISearchPublicDirectoryUseCase {
  execute(input: PublicDirectorySearchInput): Promise<PublicDirectorySearchResultDTO>;
}
