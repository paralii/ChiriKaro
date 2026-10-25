import { NotFoundError } from "@shared/errors/index.ts";

import type { IUserRepository } from "@application/interfaces/repositories/IUserRepository.ts";

import type { GetProfileResponseDTO } from "@application/dto/auth/get-user.dto.ts";

export class GetProfileUseCase {
  constructor(private readonly userRepository: IUserRepository){}

  public async execute(userId: string) : Promise<GetProfileResponseDTO> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundError("User");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      clinicId: user.clinicId,
      avatar: user.avatar ?? null,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
