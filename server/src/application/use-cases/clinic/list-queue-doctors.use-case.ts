import type { IQueueClinicContext } from "@application/interfaces/services/IQueueClinicContext.ts";
import type { IListQueueDoctorsUseCase } from "@application/interfaces/use-cases/clinic/IListQueueDoctorsUseCase.ts";
import type { QueueDoctorDTO } from "@application/dto/clinic/queue.dto.ts";
import { Role } from "@domain/value-objects/Role.ts";
import { ForbiddenError } from "@shared/errors/index.ts";

export class ListQueueDoctorsUseCase implements IListQueueDoctorsUseCase {
  constructor(private readonly context: IQueueClinicContext) {}

  async execute(input: { clinicId: string; actorUserId: string; actorRole: string }): Promise<QueueDoctorDTO[]> {
    const clinic = await this.context.getOperationalClinic(input.clinicId);
    if (input.actorRole === Role.DOCTOR) {
      const doctor = await this.context.getVerifiedDoctor(input.clinicId, input.actorUserId);
      if (!doctor.userId) throw new ForbiddenError("Doctor account is not linked to this queue");
      return [{ doctorUserId: doctor.userId, name: `${doctor.firstName} ${doctor.lastName}` }];
    }
    if (input.actorRole !== Role.CLINIC_ADMIN && input.actorRole !== Role.STAFF) throw new ForbiddenError("Doctor directory is not available to this role");
    const doctors = await this.context.listVerifiedDoctors(input.clinicId);
    return doctors.filter((doctor) => doctor.userId !== null).map((doctor) => ({ doctorUserId: doctor.userId!, name: `${doctor.firstName} ${doctor.lastName}` }));
  }
}
