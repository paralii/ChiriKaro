export type AnalyticsRange = "7d" | "30d" | "90d" | "all";
export type AnalyticsScope = { role: "SUPER_ADMIN" } | { role: "CLINIC_ADMIN"; clinicId: string } | { role: "DOCTOR"; clinicId: string; doctorUserId: string };
export interface AnalyticsRequest { range: AnalyticsRange; now?: Date }
export interface AnalyticsDTO {
  range: { key: AnalyticsRange; from: string | null; to: string; timezone: string; granularity: "day" | "week" | "month" };
  summary: Record<string, number>;
  totals: Record<string, number>;
  period: Record<string, number>;
  operational: { waitingQueueCount: number; inProgressQueueCount: number };
  distributions: { appointments: Array<{ status: string; count: number }>; payments: Array<{ status: string; count: number }>; doctors: Array<{ status: string; count: number }>; clinics: Array<{ status: string; count: number }> };
  trends: Record<string, Array<{ date: string; count: number; amountMinor?: number }>>;
  clinicRankings: Array<{ clinicId: string; name: string; appointments: number; consultations: number; revenueMinor: number }>;
  doctorRankings: Array<{ doctorUserId: string; name: string; appointments: number; consultations: number }>;
  doctorActivity: Array<{ doctorUserId: string; name: string; date: string; appointments: number; consultations: number }>;
  doctorDistribution: Array<{ clinicId: string; count: number }>;
}
