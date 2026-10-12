import { Clinic, ClinicStatus } from "../../domain/entities/clinic.entity.js";
import { User } from "../../domain/entities/user.entity.js";
import { Role } from "../../domain/value-objects/Role.js";
import { UserStatus } from "../../shared/enums/user-statues.enum.js";
import { ConflictError } from "../../shared/errors/index.js";
import type {
  IClinicRepository,
  IdGenerator,
  ILogger,
  IPasswordHasher,
  IRegistrationOtpVerifier,
  IUserRepository,
} from "../interfaces/clinic.ports.js";

export interface RegisterClinicInput {
  name: string;
  address: string | null;
  phone: string | null;
  ownerName: string;
  email: string;
  password: string;
  otp: string;
}

export class ClinicRegistrationService {
  constructor(
    private readonly clinicRepository: IClinicRepository,
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly otpVerifier: IRegistrationOtpVerifier,
    private readonly logger: ILogger,
    private readonly generateId: IdGenerator,
  ) {}

  async register(input: RegisterClinicInput): Promise<Clinic> {
    if (await this.userRepository.findByEmail(input.email)) {
      throw new ConflictError("An account with this email already exists");
    }

    await this.otpVerifier.verify(input.email, input.otp);

    const clinicId = this.generateId();
    const ownerAdminId = this.generateId();

    const clinic = Clinic.create({
      id: clinicId,
      name: input.name,
      address: input.address,
      phone: input.phone,
      ownerName: input.ownerName,
      contactEmail: input.email,
      ownerAdminId,
      status: ClinicStatus.PENDING,
    });

    const owner = User.create({
      id: ownerAdminId,
      name: input.ownerName,
      email: input.email,
      passwordHash: await this.passwordHasher.hash(input.password),
      role: Role.CLINIC_ADMIN,
      clinicId,
      status: UserStatus.INVITED,
      isEmailVerified: false,
    });

    const savedOwner = await this.userRepository.save(owner);

    try {
      return await this.clinicRepository.save(clinic);
    } catch (error) {
      await this.rollbackOwner(savedOwner.id);
      throw error;
    }
  }

  private async rollbackOwner(ownerId: string): Promise<void> {
    try {
      await this.userRepository.deleteById(ownerId);
    } catch (rollbackError) {
      this.logger.error(`Failed to roll back clinic owner ${ownerId}: ${(rollbackError as Error).message}`);
    }
  }
}