export type ClinicStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
export type Clinic = { id: string; name: string; address?: string | null; phone?: string | null; ownerName?: string; contactEmail?: string; status: string; isActive: boolean };
export type ClinicSummary = { total: number; pending: number; approved: number; rejected: number; blocked: number };
export type Invitation = { email: string; role: 'DOCTOR' | 'STAFF'; inviteUrl: string };
export type AuthResult = {
  user: { id: string; name: string; email: string; role: string; clinicId?: string | null; status?: string };
  accessToken: string;
  refreshToken: string;
};
export type WorkingHour = { day: string; isOpen: boolean; startTime: string; endTime: string };
export type ClinicDocument = { documentType: string; documentKey: string; uploadedAt: string };
export type ClinicProfile = {
  id: string; name: string; description: string | null; address: string | null; city: string | null; state: string | null;
  pincode: string | null; phone: string | null; ownerName: string | null; contactEmail: string | null;
  registrationNumber: string | null; clinicType: string | null; specializations: string[];
  workingHours: WorkingHour[]; documents: ClinicDocument[];
};
export type DoctorDocument = { documentType: string; documentUrl: string; status: string; uploadedAt: string; rejectionReason?: string | null };
export type DoctorProfile = {
  firstName: string; lastName: string; phone: string | null; gender: string | null; dateOfBirth: string | null;
  professionalTitle: string | null; qualification: string | null; yearsOfExperience: number | null;
  registrationNumber: string | null; registrationAuthority: string | null; bio: string | null;
  specializations: string[]; procedures: string[]; workingHours: WorkingHour[]; consultationFee: number | null;
  slotDuration: number; bufferMinutes: number; verificationStatus: string; onboardingProgress: number;
  documents: DoctorDocument[]; rejectionReason: string | null;
};
export type SlotConfig = { slotDuration: number; bufferMinutes: number; consultationFee: number | null };
export type Slot = { day: string; startTime: string; endTime: string };
export type DoctorSummary = {
  id: string; userId: string; name: string; email: string; specializations: string[];
  verificationStatus: string; consultationFee: number | null; onboardingProgress: number;
};
export type DoctorDetail = {
  phone: string | null; yearsOfExperience: number | null; firstName: string; lastName: string;
  professionalTitle: string | null; qualification: string | null; registrationNumber: string | null;
  registrationAuthority: string | null; bio: string | null; specializations: string[]; procedures: string[];
  workingHours: WorkingHour[];
  documents: Array<{ documentType: string; status: string; rejectionReason?: string | null }>;
};