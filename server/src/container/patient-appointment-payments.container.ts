import { Role } from "@domain/value-objects/Role.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { RazorpayService } from "@infrastructure/services/razorpay.service.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { PatientAppointmentPaymentsUseCase } from "@application/use-cases/patient/patient-appointment-payments.use-case.ts";
import { PatientAppointmentPaymentsController } from "@presentation/controllers/patient-appointment-payments.controller.ts";
import { PatientAppointmentPaymentsRouter } from "@presentation/routes/patient-appointment-payments.routes.ts";

const clinicRepository = new ClinicRepository();
const authMiddleware = new AuthMiddleware({ tokenService: new TokenService(), userRepository: new MongoUserRepository(), clinicRepository });
const paymentsUseCase = new PatientAppointmentPaymentsUseCase(new RazorpayService());

export const patientAppointmentPaymentsRouter = PatientAppointmentPaymentsRouter(
  new PatientAppointmentPaymentsController(paymentsUseCase),
  { authenticate: authMiddleware.authenticate, authorizePatient: authMiddleware.authorize(Role.PATIENT) },
);
