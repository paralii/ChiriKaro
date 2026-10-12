import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { SafeUserDto } from "../../dto/auth/AuthResponseDto";
import { NotFoundError } from "../../../shared/errors";

export class GetProfileUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  public async execute(userId: string): Promise<SafeUserDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError("User");
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
    };
  }
}
