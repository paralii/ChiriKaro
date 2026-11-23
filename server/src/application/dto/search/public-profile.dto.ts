export interface PublicClinicDoctorDTO {
  listingId: string;
  doctorName: string;
  professionalTitle: string | null;
  specializations: string[];
  consultationFee: number;
  currency: "INR";
}

export interface PublicClinicProfileDTO {
  name: string;
  description: string | null;
  clinicType: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  specializations: string[];
  doctors: PublicClinicDoctorDTO[];
}

export interface PublicDoctorProfileDTO {
  listingId: string;
  name: string;
  avatar: string | null;
  professionalTitle: string | null;
  qualifications: string[];
  yearsOfExperience: number | null;
  specializations: string[];
  consultationFee: number;
  currency: "INR";
  clinic: {
    listingId: string;
    name: string;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    phone: string | null;
  };
}
