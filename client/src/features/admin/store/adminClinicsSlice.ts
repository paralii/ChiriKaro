import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { superAdminService } from '@/features/admin/services/superAdminService';
import type { Clinic, ClinicStatus, ClinicSummary, SuperAdminDoctorStatistics } from '@/shared/types';
import type { ClinicPage } from '@/features/admin/services/superAdminService';

const initialState = {
  items: [] as Clinic[],
  summary: { total: 0, pending: 0, approved: 0, rejected: 0, blocked: 0 } as ClinicSummary,
  doctorStatistics: {
    total: 0, verified: 0, pendingVerification: 0, rejected: 0,
    verificationOverview: { notStarted: 0, inProgress: 0, pendingVerification: 0, verified: 0, rejected: 0 },
  } as SuperAdminDoctorStatistics,
  page: 1, limit: 20, totalItems: 0, totalPages: 0, filterStatus: '', filterSearch: '',
  busy: false, error: '', message: '',
};

export type ClinicDirectoryQuery = { page: number; search?: string; status?: string };
export const loadAdminClinics = createAsyncThunk<{ clinics: ClinicPage; statistics: { clinics: ClinicSummary; doctors: SuperAdminDoctorStatistics }; query: ClinicDirectoryQuery }, ClinicDirectoryQuery>('adminClinics/load', async (query) => {
  const [clinics, statistics] = await Promise.all([superAdminService.listClinics(query.page, 20, query.search, query.status), superAdminService.getStatistics()]);
  return { clinics, statistics, query };
});

export const changeClinicStatus = createAsyncThunk('adminClinics/changeStatus', async ({ id, status, reason }: { id: string; status: ClinicStatus; reason?: string }) => {
  const clinic = await superAdminService.updateStatus(id, status, reason);
  return { clinic, statistics: await superAdminService.getStatistics() };
});

const slice = createSlice({
  name: 'adminClinics',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadAdminClinics.pending, (s) => { s.busy = true; s.error = ''; })
      .addCase(loadAdminClinics.fulfilled, (s, a) => {
        const result: ClinicPage = a.payload.clinics;
        s.items = result.items; s.page = result.page; s.limit = result.limit;
        s.totalItems = result.totalItems; s.totalPages = result.totalPages;
        s.filterStatus = a.payload.query.status ?? ''; s.filterSearch = a.payload.query.search ?? '';
        s.summary = a.payload.statistics.clinics; s.doctorStatistics = a.payload.statistics.doctors; s.error = ''; s.busy = false;
      })
      .addCase(loadAdminClinics.rejected, (s, a) => { s.busy = false; s.error = a.error.message ?? 'Could not load this workspace.'; })
      .addCase(changeClinicStatus.pending, (s) => { s.busy = true; s.error = ''; s.message = ''; })
      .addCase(changeClinicStatus.fulfilled, (s, a) => {
        const { clinic, statistics } = a.payload;
        const existing = s.items.find((c) => c.id === clinic.id);
        if (existing && (!s.filterStatus || s.filterStatus === clinic.status)) Object.assign(existing, clinic);
        if (existing && s.filterStatus && s.filterStatus !== clinic.status) {
          s.items = s.items.filter((item) => item.id !== clinic.id);
          s.totalItems = Math.max(0, s.totalItems - 1);
          s.totalPages = Math.ceil(s.totalItems / s.limit);
        }
        s.summary = statistics.clinics; s.doctorStatistics = statistics.doctors; s.busy = false; s.message = `Clinic ${clinic.status.toLowerCase()}.`;
      })
      .addCase(changeClinicStatus.rejected, (s, a) => { s.busy = false; s.error = a.error.message ?? 'Could not update clinic.'; });
  },
});

export default slice.reducer;
