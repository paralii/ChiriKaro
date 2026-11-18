import { Role } from "@domain/value-objects/Role.ts";
import { AppointmentRepository } from "@infrastructure/repositories/appointment.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { DoctorRepository } from "@infrastructure/repositories/doctor.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { PublicListingIdService } from "@infrastructure/services/public-listing-id.service.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { PatientAppointmentsUseCase } from "@application/use-cases/patient/patient-appointments.use-case.ts";
import { GetPublicListingAvailabilityUseCase } from "@application/use-cases/search/get-public-listing-availability.use-case.ts";
import { PatientAppointmentsController } from "@presentation/controllers/patient-appointments.controller.ts";
import { PatientAppointmentsRouter } from "@presentation/routes/patient-appointments.routes.ts";

const appointmentRepository = new AppointmentRepository();
const clinicRepository = new ClinicRepository();
const doctorRepository = new DoctorRepository();
const listingIdService = new PublicListingIdService();
const availabilityUseCase = new GetPublicListingAvailabilityUseCase(listingIdService, clinicRepository, doctorRepository, appointmentRepository);
const appointmentsUseCase = new PatientAppointmentsUseCase(appointmentRepository, clinicRepository, doctorRepository, listingIdService, availabilityUseCase);
const authMiddleware = new AuthMiddleware({
  tokenService: new TokenService(),
  userRepository: new MongoUserRepository(),
  clinicRepository,
});

export const patientAppointmentsRouter = PatientAppointmentsRouter(
  new PatientAppointmentsController(appointmentsUseCase),
  {
    authenticate: authMiddleware.authenticate,
    authorizePatient: authMiddleware.authorize(Role.PATIENT),
  },
);
