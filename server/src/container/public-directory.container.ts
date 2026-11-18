import { PublicDirectoryRepository } from "@infrastructure/repositories/public-directory.repository.ts";
import { SearchPublicDirectoryUseCase } from "@application/use-cases/search/search-public-directory.use-case.ts";
import { PublicDirectoryController } from "@presentation/controllers/public-directory.controller.ts";
import { PublicDirectoryRouter } from "@presentation/routes/public-directory.routes.ts";
import { PublicListingIdService } from "@infrastructure/services/public-listing-id.service.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { DoctorRepository } from "@infrastructure/repositories/doctor.repository.ts";
import { GetPublicListingAvailabilityUseCase } from "@application/use-cases/search/get-public-listing-availability.use-case.ts";
import { AppointmentRepository } from "@infrastructure/repositories/appointment.repository.ts";

const repository = new PublicDirectoryRepository();
const listingIdService = new PublicListingIdService();
const searchUseCase = new SearchPublicDirectoryUseCase(repository, listingIdService);
const appointmentRepository = new AppointmentRepository();
const availabilityUseCase = new GetPublicListingAvailabilityUseCase(listingIdService, new ClinicRepository(), new DoctorRepository(), appointmentRepository);
export const publicDirectoryRouter = PublicDirectoryRouter(new PublicDirectoryController(searchUseCase, availabilityUseCase));
