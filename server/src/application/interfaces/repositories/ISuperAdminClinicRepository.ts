import type { Clinic } from "@domain/entities/clinic.entity.ts";

export interface ISuperAdminClinicRepository {
  findById(id: string): Promise<Clinic | null>;
  findPage(options: { skip: number; limit: number }): Promise<{
    clinics: Clinic[];
    totalItems: number;
  }>;
  save(clinic: Clinic): Promise<Clinic>;
}
