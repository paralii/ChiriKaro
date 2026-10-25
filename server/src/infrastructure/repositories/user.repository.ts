import { Types } from "mongoose";

import { User } from "@domain/entities/user.entity.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { UserStatus } from "@domain/enum/user-statues.enum.ts";

import type { IUserDocument } from "@infrastructure/database/mongodb/models/UserModel.ts";
import { UserModel } from "@infrastructure/database/mongodb/models/UserModel.ts";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";

export class MongoUserRepository
  extends BaseRepository<IUserDocument>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await super.findDocumentById(id);
    return doc ? this.toDomain(doc) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const document = await super.findOneDocument({
      email: email.toLowerCase().trim(),
    });

    return document ? this.toDomain(document) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const doc = await this.model
      .findOne({ googleId })
      .select("+googleId")
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByClinic(clinicId: string): Promise<User[]> {
    const docs = await super.findDocument({
      clinicId: new Types.ObjectId(clinicId),
    });
    return docs.map((doc) => this.toDomain(doc));
  }

  async existsByEmail(email: string): Promise<boolean> {
    const document = await this.model.exists({
      email: email.toLowerCase().trim(),
    });

    return document !== null;
  }

  async existsByRole(role: Role): Promise<boolean> {
    const document = await this.model.exists({
      role: role,
    });
    return document !== null;
  }

  async save(user: User): Promise<User> {
    const document = await super.create(this.toPersistence(user));

    return this.toDomain(document);
  }

  async update(user: User): Promise<User> {
    const document = await super.updateDocumentById(
      user.id,
      this.toPersistence(user),
    );

    if (!document) {
      throw new Error(`User with ID ${user.id} not found`);
    }

    return this.toDomain(document);
  }

  private toDomain(document: IUserDocument): User {
    return User.fromPersistence({
      id: document._id.toString(),
      name: document.name,
      email: document.email,
      ...(document.password !== undefined
        ? { passwordHash: document.password }
        : {}),
      role: document.role as Role,
      status: document.status as UserStatus,
      clinicId: document.clinicId?.toString() ?? null,
      ...(document.googleId !== undefined
        ? { googleId: document.googleId }
        : {}),
      avatar: document.avatar ?? null,
      isEmailVerified: document.isEmailVerified,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  private toPersistence(user: User): Partial<IUserDocument> {
    return {
      name: user.name,
      email: user.email,
      ...(user.passwordHash !== undefined
        ? { password: user.passwordHash }
        : {}),
      role: user.role,
      status: user.status,
      clinicId: user.clinicId ? new Types.ObjectId(user.clinicId) : null,
      ...(user.googleId !== undefined ? { googleId: user.googleId } : {}),
      ...(user.avatar !== undefined ? { avatar: user.avatar } : {}),
      isEmailVerified: user.isEmailVerified,
    };
  }
}
