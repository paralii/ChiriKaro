export interface UpdatePatientProfileDTO {
  userId: string;
  name?: unknown;
  avatar?: unknown;
}

export interface PatientProfileDTO {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}
