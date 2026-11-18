export interface PublicDirectorySearchInput {
  query?: string;
  city?: string;
  specialization?: string;
  page: number;
  limit: number;
}

export interface PublicDirectoryListingDTO {
  clinicName: string;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  doctorName: string;
  professionalTitle: string | null;
  specializations: string[];
  consultationFee: number;
  currency: "INR";
}

export interface PublicDirectorySearchResultDTO {
  items: PublicDirectoryListingDTO[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}
