export interface SuperAdminStatisticsDTO {
  clinics: {
    total: number;
    approved: number;
    pending: number;
    blocked: number;
  };
  doctors: {
    total: number;
    verified: number;
    pendingVerification: number;
    rejected: number;
    verificationOverview: {
      notStarted: number;
      inProgress: number;
      pendingVerification: number;
      verified: number;
      rejected: number;
    };
  };
}
