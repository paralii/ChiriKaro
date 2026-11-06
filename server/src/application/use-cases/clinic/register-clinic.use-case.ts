import { Clinic } from "@domain/entities/clinic.entity.ts";
import { User } from "@domain/entities/user.entity.ts";
import { ClinicStatus } from "@domain/enum/clinic-status.enum.ts";
import { Role } from "@domain/value-objects/Role.ts";

import {
  ConflictError,
  InternalServerError,
  ValidationError,
} from "@shared/errors/index.ts";

import type { IRegisterClinicUseCase } from "@application/interfaces/use-cases/clinic/IRegisterClinicUseCase.ts";
import type {
  RegisterClinicDTO,
  RegisterClinicResultDTO,
} from "@application/dto/clinic/register-clinic.dto.ts";

import type { IClinicRepository } from "@application/interfaces/repositories/IClinicRepository.ts";
import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";
import type { IOtpRepository } from "@application/interfaces/repositories/IOtpRepository.ts";
import type { IPasswordService } from "@application/interfaces/services/IPasswordService.ts";
import type { IOtpService } from "@application/interfaces/services/IOtpService.ts";
import type { IEmailService } from "@application/interfaces/services/IEmailService.ts";

export class RegisterClinicUseCase implements IRegisterClinicUseCase {
  constructor(
    private readonly _clinicRepository: IClinicRepository,
    private readonly _userRepository: IUserRepository,
    private readonly _passwordService: IPasswordService,
    private readonly _otpService: IOtpService,
    private readonly _otpRepository: IOtpRepository,
    private readonly _emailService: IEmailService,
  ) {}

  public async execute(
    dto: RegisterClinicDTO,
  ): Promise<RegisterClinicResultDTO> {
    const { admin, clinic } = dto;

    if (await this._userRepository.existsByEmail(admin.email)) {
      throw new ConflictError("Email is already registered");
    }

    if (!admin.password || admin.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters");
    }

    const passwordHash = await this._passwordService.hash(admin.password);

    const newClinic = Clinic.create({
      ...clinic,
      status: ClinicStatus.PENDING,
    });

    const savedClinic = await this._clinicRepository.save(newClinic);

    const newAdmin = User.create({
      name: admin.name,
      email: admin.email,
      role: Role.CLINIC_ADMIN,
      clinicId: savedClinic.id,
      passwordHash,
      isEmailVerified: false,
    });

    let savedAdmin: User;

    try {
      savedAdmin = await this._userRepository.save(newAdmin);
    } catch (error) {
      await this._clinicRepository.deleteById(savedClinic.id!);
      throw error;
    }

    savedClinic.assignAdmin(savedAdmin.id);

    const finalClinic = await this._clinicRepository.save(savedClinic);

    const { code, codeHash, expiresAt } = this._otpService.generate();

    const otpKey = `registration-otp:${savedAdmin.id}`;

    const ttlSeconds = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );

    await this._otpRepository.save(otpKey, { codeHash, expiresAt }, ttlSeconds);

    try {
      await this._emailService.sendOtpEmail(
        savedAdmin.email,
        savedAdmin.name,
        code,
        "registration",
      );
    } catch {
      await this._otpRepository.delete(otpKey);

      throw new InternalServerError(
        "Clinic registered, but verification email could not be sent. Please request a new code.",
      );
    }

    return {
      clinic: {
        id: finalClinic.id!,
        name: finalClinic.name,
        address: finalClinic.address ?? null,
        city: finalClinic.city ?? null,
        state: finalClinic.state ?? null,
        pincode: finalClinic.pincode ?? null,
        phone: finalClinic.phone ?? null,
        contactEmail: finalClinic.contactEmail ?? null,
        registrationNumber: finalClinic.registrationNumber ?? null,
        ownerAdminId: finalClinic.ownerAdminId,
        status: finalClinic.status,
        createdAt: finalClinic.createdAt,
      },
      admin: {
        id: savedAdmin.id,
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role,
        clinicId: savedAdmin.clinicId,
      },
      message:
        "Clinic registered and pending approval. Please verify your email.",
    };
  }
}
