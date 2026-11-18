import { Role } from "@domain/value-objects/Role.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { QueueRepository } from "@infrastructure/repositories/queue.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { ListPatientQueueUseCase } from "@application/use-cases/patient/list-patient-queue.use-case.ts";
import { PatientQueueController } from "@presentation/controllers/patient-queue.controller.ts";
import { PatientQueueRouter } from "@presentation/routes/patient-queue.routes.ts";

const clinics = new ClinicRepository();
const auth = new AuthMiddleware({ tokenService: new TokenService(), userRepository: new MongoUserRepository(), clinicRepository: clinics });

export const patientQueueRouter = PatientQueueRouter(
  new PatientQueueController(new ListPatientQueueUseCase(new QueueRepository())),
  { authenticate: auth.authenticate, authorizePatient: auth.authorize(Role.PATIENT) },
);
