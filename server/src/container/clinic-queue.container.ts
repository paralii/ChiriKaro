import { Role } from "@domain/value-objects/Role.ts";
import { AppointmentRepository } from "@infrastructure/repositories/appointment.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { DoctorRepository } from "@infrastructure/repositories/doctor.repository.ts";
import { QueueRepository } from "@infrastructure/repositories/queue.repository.ts";
import { QueueTokenSequenceRepository } from "@infrastructure/repositories/queue-token-sequence.repository.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { QueueClinicContextService } from "@application/services/queue-clinic-context.service.ts";
import { RegisterWalkInUseCase } from "@application/use-cases/clinic/register-walk-in.use-case.ts";
import { CheckInAppointmentUseCase } from "@application/use-cases/clinic/check-in-appointment.use-case.ts";
import { ListClinicQueueUseCase } from "@application/use-cases/clinic/list-clinic-queue.use-case.ts";
import { ListQueueDoctorsUseCase } from "@application/use-cases/clinic/list-queue-doctors.use-case.ts";
import { ClinicQueueController } from "@presentation/controllers/clinic-queue.controller.ts";
import { ClinicQueueRouter } from "@presentation/routes/clinic-queue.routes.ts";

const clinics = new ClinicRepository();
const doctors = new DoctorRepository();
const users = new MongoUserRepository();
const queue = new QueueRepository();
const queueTokens = new QueueTokenSequenceRepository();
const appointments = new AppointmentRepository();
const clinicContext = new QueueClinicContextService(clinics, doctors);
const auth = new AuthMiddleware({ tokenService: new TokenService(), userRepository: users, clinicRepository: clinics });

export const clinicQueueRouter = ClinicQueueRouter(
  new ClinicQueueController(
    new RegisterWalkInUseCase(queue, queueTokens, users, clinicContext),
    new CheckInAppointmentUseCase(queue, queueTokens, appointments, users, clinicContext),
    new ListClinicQueueUseCase(queue, clinicContext),
    new ListQueueDoctorsUseCase(clinicContext),
  ),
  {
    authenticate: auth.authenticate,
    authorizeWalkIn: auth.authorize(Role.CLINIC_ADMIN, Role.STAFF),
    authorizeQueueRead: auth.authorize(Role.CLINIC_ADMIN, Role.STAFF, Role.DOCTOR),
  },
);
