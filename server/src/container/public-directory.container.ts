import { PublicDirectoryRepository } from "@infrastructure/repositories/public-directory.repository.ts";
import { SearchPublicDirectoryUseCase } from "@application/use-cases/search/search-public-directory.use-case.ts";
import { PublicDirectoryController } from "@presentation/controllers/public-directory.controller.ts";
import { PublicDirectoryRouter } from "@presentation/routes/public-directory.routes.ts";

const repository = new PublicDirectoryRepository();
const searchUseCase = new SearchPublicDirectoryUseCase(repository);
export const publicDirectoryRouter = PublicDirectoryRouter(new PublicDirectoryController(searchUseCase));
