import type { Role } from "@/features/auth/store/authSlice";

export type AuthResult = {
  user: { id: string; name: string; email: string; role: Role ; clinicId?: string | null; avatar?: string | null; status?: string };
  accessToken: string;
  refreshToken: string;
};
export type LoginResponse = { success: boolean; message: string; data?: AuthResult['user'] };
export type RegisterResult = {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  message: string;
};

export type ClinicStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'BLOCKED';
export type Clinic = { id: string; name: string; address?: string | null; phone?: string | null; ownerName?: string | null; ownerAdminId?: string | null; contactEmail?: string | null; status: ClinicStatus; isActive?: boolean; createdAt?: string; updatedAt?: string };
export type ClinicSummary = { total: number; pending: number; approved: number; rejected: number; blocked: number };
export type RoleDashboard = {
  user: { id: string; name: string; role: Role; clinicId: string | null };
  clinic: { id: string; name: string; status: ClinicStatus } | null;
};
export type PatientProfile = { id: string; name: string; email: string; avatar: string | null; createdAt: string; updatedAt: string };
export type Invitation = { id: string; email: string; role: 'DOCTOR' | 'STAFF'; clinicId: string; status: string; expiresAt: string; createdAt: string };
export type InvitationValidation = { email: string; role: 'DOCTOR' | 'STAFF'; clinicId: string; clinicName: string; expiresAt: string };
export type WorkingHour = { day: string; isOpen: boolean; startTime: string; endTime: string };
export type ClinicDocument = { documentType: string; documentKey?: string; uploadedAt: string };
export type ClinicProfile = {
  id: string; name: string; description?: string | null; address: string | null; city: string | null; state: string | null;
  pincode: string | null; phone: string | null; ownerName?: string | null; ownerAdminId?: string | null; contactEmail: string | null;
  registrationNumber: string | null; clinicType?: string | null; specializations: string[];
  workingHours: WorkingHour[]; documents: ClinicDocument[]; status: ClinicStatus; setupStatus?: string;
  createdAt?: string; updatedAt?: string;
};
export type ClinicDashboard = { clinic: ClinicProfile; totalDoctors: number; totalStaff: number; totalTeamMembers: number };
export type DoctorDocument = { documentType: string; documentUrl: string; status: string; uploadedAt: string; rejectionReason?: string | null };
export type DoctorProfile = {
  firstName: string; lastName: string; phone: string | null; gender: string | null; dateOfBirth: string | null;
  professionalTitle: string | null; qualification: string | null; yearsOfExperience: number | null;
  registrationNumber: string | null; registrationAuthority: string | null; bio: string | null;
  specializations: string[]; procedures: string[]; workingHours: WorkingHour[]; consultationFee: number | null;
  slotDuration: number; bufferMinutes: number; verificationStatus: string; onboardingProgress: number;
  documents: DoctorDocument[]; rejectionReason: string | null;
};
export type DoctorDayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
export type DoctorGender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type DoctorOnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
export type DoctorOnboardingStep = 'basic' | 'professional' | 'practice';
export type DoctorOnboardingProfile = {
  id: string;
  firstName: string;
  lastName: string;
  gender: DoctorGender | null;
  dateOfBirth: string | null;
  professionalTitle: string | null;
  qualifications: string[];
  yearsOfExperience: number | null;
  registrationNumber: string | null;
  registrationAuthority: string | null;
  specializations: string[];
  procedures: string[];
  workingHours: Array<{ day: DoctorDayOfWeek; isOpen: boolean; startTime: string; endTime: string }>;
  documents: Array<{ documentType: string; status: string; uploadedAt: string; verifiedAt: string | null; rejectionReason: string | null }>;
  onboardingStatus: DoctorOnboardingStatus;
  rejectionReason: string | null;
  createdAt?: string;
  updatedAt?: string;
};
export type DoctorOnboardingDTO = { onboardingStatus: DoctorOnboardingStatus; profile: DoctorOnboardingProfile | null };
export type DoctorVerificationSummary = {
  doctorId: string;
  firstName: string;
  lastName: string;
  professionalTitle: string | null;
  verificationStatus: DoctorOnboardingStatus;
  updatedAt: string;
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
