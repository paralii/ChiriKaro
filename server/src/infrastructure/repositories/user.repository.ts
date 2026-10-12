import { Types } from "mongoose";
import type { IUserDocument } from "@infrastructure/database/mongodb/models/UserModel.js";
import { UserModel } from "@infrastructure/database/mongodb/models/UserModel.js";
import { BaseRepository } from "@infrastructure/database/mongodb/mongodb.base.repository.js";
import type { IUserRepository } from "../../domain/repositories/IUserRepository.js";
import { User } from "../../domain/entities/user.entity.js";
import type { Role } from "../../domain/value-objects/Role.js";

export class MongoUserRepository
  extends BaseRepository<IUserDocument>
  implements IUserRepository
{
  constructor() {
    super(UserModel);
  }

  async findById(id: string): Promise<User | null> {
    const doc = await this.model.findById(id).exec();
    return doc ? this.toDomain(doc) : null;
  }

  /**
   * password is select:false on the schema, so we explicitly re-select it here.
   * This is the ONE place that needs the hash - LoginUseCase compares it via
   * IPasswordHasher.compare(raw, user.passwordHash), never touching Mongoose.
   */
  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.model
      .findOne({ email: email.toLowerCase() })
      .select("+password")
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const doc = await this.model
      .findOne({ googleId })
      .select("+googleId")
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByClinic(clinicId: string): Promise<User[]> {
    const docs = await this.model.find({ clinicId }).exec();
    return docs.map((doc) => this.toDomain(doc));
  }

  /** Used by SeedSuperAdminUseCase to stay idempotent - don't seed twice. */
  async existsByRole(role: Role): Promise<boolean> {
    const count = await this.model.countDocuments({ role });
    return count > 0;
  }

  /**
   * Acts as both create and update: the domain entity already carries its id
   * (assigned via IIdGenerator before User.create() is called), so we upsert
   * on _id rather than branching create/update logic here.
   */
  async save(user: User): Promise<User> {
    const doc = await this.model
      .findOneAndUpdate(
        { _id: new Types.ObjectId(user.id) },
        { $set: this.toPersistence(user) },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .select("+password")
      .exec();
    return this.toDomain(doc!);
  }

  private toDomain(doc: IUserDocument): User {
    return User.fromPersistence({
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      passwordHash: doc.password ?? "",
      role: doc.role,
      status: doc.status,
      clinicId: doc.clinicId ? doc.clinicId.toString() : null,
      googleId: doc.googleId ?? "",
      avatar: doc.avatar ?? null,
      isEmailVerified: doc.isEmailVerified,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private toPersistence(user: User) {
    return {
      name: user.name,
      email: user.email,
      // Only overwrite password if the entity actually carries one -
      // avoids wiping the hash on updates that don't touch it.
      ...(user.passwordHash ? { password: user.passwordHash } : {}),
      role: user.role,
      status: user.status,
      clinicId: user.clinicId ? new Types.ObjectId(user.clinicId) : null,
      ...(user.googleId ? { googleId: user.googleId } : {}),
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    };
  }
}
