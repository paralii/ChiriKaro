import { randomUUID } from "node:crypto";
import { User } from "@domain/entities/user.entity.js";
import { MongoUserRepository } from "@infrastructure/repositories/user.repository.ts";
import { PasswordService } from "@infrastructure/services/bcrypt/bcrypt.password.service.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";
import { MongoDatabase } from "@infrastructure/database/mongodb/mongodb.ts";
import { logger } from "@infrastructure/logger/logger.ts";

export const mongoDatabase = new MongoDatabase();

interface SeedSuperAdminEnv {
  name: string;
  email: string;
  password: string;
}

const readSeedEnv = (): SeedSuperAdminEnv => {
  const name = process.env.SUPER_ADMIN_NAME;
  const email = process.env.SUPER_ADMIN_EMAIL;
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error(
      "Missing SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD environment variables",
    );
  }

  if (password.length < 8) {
    throw new Error("SUPER_ADMIN_PASSWORD must be at least 8 characters long");
  }

  return { name, email, password };
};

const run = async (): Promise<void> => {
  const { name, email, password } = readSeedEnv();

  const userRepository = new MongoUserRepository();
  const passwordService = new PasswordService();

  await mongoDatabase.connect();

  try {
    const existing = await userRepository.findByEmail(email);

    if (existing) {
      if (existing.role !== Role.SUPER_ADMIN) {
        throw new Error(
          `The configured admin email is already used by a ${existing.role} account`,
        );
      }
      logger.warn(
        `Seed skipped: a super admin with email "${email}" already exists`,
      );
      return;
    }

    const hashedPassword = await passwordService.hash(password);

    const admin = User.create({
      id: randomUUID(),
      name,
      email,
      passwordHash: hashedPassword,
      role: Role.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      clinicId: null,
      isEmailVerified: true,
    });

    const savedAdmin = await userRepository.save(admin); logger.info(`Seeded first admin: ${savedAdmin.email}`);
  } finally {
    await mongoDatabase.disconnect();
  }
};

run()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    logger.error(`Admin seed failed: ${error.message}`);
    process.exit(1);
  });
