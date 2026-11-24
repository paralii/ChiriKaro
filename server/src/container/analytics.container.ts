import { AnalyticsRepository } from "@infrastructure/repositories/analytics.repository.ts";
import { GetAnalyticsUseCase } from "@application/use-cases/dashboard/get-analytics.use-case.ts";
import { AnalyticsController } from "@presentation/controllers/analytics.controller.ts";
import { AnalyticsRouter } from "@presentation/routes/analytics.routes.ts";
import { AuthMiddleware } from "@presentation/middleware/auth.middleware.ts";
import { TokenService } from "@infrastructure/services/jwt/jwt.token.service.ts";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { ClinicRepository } from "@infrastructure/repositories/clinic.repository.ts";

const auth = new AuthMiddleware({ tokenService: new TokenService(), userRepository: new MongoUserRepository(), clinicRepository: new ClinicRepository() });
export const analyticsRouter = AnalyticsRouter(new AnalyticsController(new GetAnalyticsUseCase(new AnalyticsRepository())), { authenticate: auth.authenticate, authorize: (...roles) => auth.authorize(...roles) });
