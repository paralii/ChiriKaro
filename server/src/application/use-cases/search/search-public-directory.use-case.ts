import type { PublicDirectorySearchInput, PublicDirectorySearchResultDTO } from "@application/dto/search/public-directory.dto.ts";
import type { IPublicDirectoryRepository } from "@application/interfaces/repositories/IPublicDirectoryRepository.ts";
import type { ISearchPublicDirectoryUseCase } from "@application/interfaces/use-cases/search/ISearchPublicDirectoryUseCase.ts";
import { ValidationError } from "@shared/errors/index.ts";

const MAX_QUERY_LENGTH = 100;

export class SearchPublicDirectoryUseCase implements ISearchPublicDirectoryUseCase {
  constructor(private readonly _repository: IPublicDirectoryRepository) {}

  async execute(input: PublicDirectorySearchInput): Promise<PublicDirectorySearchResultDTO> {
    for (const [field, value] of Object.entries({ query: input.query, city: input.city, specialization: input.specialization })) {
      if (value !== undefined && (typeof value !== "string" || value.trim().length > MAX_QUERY_LENGTH)) {
        throw new ValidationError(`${field} must be a string of at most ${MAX_QUERY_LENGTH} characters`);
      }
    }
    if (!Number.isInteger(input.page) || input.page < 1 || input.page > 100_000) throw new ValidationError("page must be an integer from 1 to 100000");
    if (!Number.isInteger(input.limit) || input.limit < 1 || input.limit > 50) throw new ValidationError("limit must be an integer from 1 to 50");

    const page = await this._repository.search({
      ...(input.query?.trim() ? { query: input.query.trim() } : {}),
      ...(input.city?.trim() ? { city: input.city.trim() } : {}),
      ...(input.specialization?.trim() ? { specialization: input.specialization.trim() } : {}),
      skip: (input.page - 1) * input.limit,
      limit: input.limit,
    });

    return {
      items: page.items,
      page: input.page,
      limit: input.limit,
      totalItems: page.totalItems,
      totalPages: Math.ceil(page.totalItems / input.limit),
    };
  }
}
