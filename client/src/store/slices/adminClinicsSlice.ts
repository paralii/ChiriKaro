import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { superAdminService } from '@/services/superAdminService';
import type { Clinic, ClinicStatus, ClinicSummary } from '@/types';

const initialState = {
  items: [] as Clinic[],
  summary: { total: 0, pending: 0, approved: 0, rejected: 0, blocked: 0 } as ClinicSummary,
  busy: false, error: '', message: '',
};

export const loadAdminClinics = createAsyncThunk('adminClinics/load', async () => {
  const [items, summary] = await Promise.all([superAdminService.listClinics(), superAdminService.getSummary()]);
  return { items, summary };
});

export const changeClinicStatus = createAsyncThunk('adminClinics/changeStatus', async ({ id, status }: { id: string; status: ClinicStatus }) => {
  await superAdminService.updateStatus(id, status);
  return { id, status, summary: await superAdminService.getSummary() };
});

const slice = createSlice({
  name: 'adminClinics',
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadAdminClinics.fulfilled, (s, a) => { s.items = a.payload.items; s.summary = a.payload.summary; s.error = ''; })
      .addCase(loadAdminClinics.rejected, (s, a) => { s.error = a.error.message ?? 'Could not load this workspace.'; })
      .addCase(changeClinicStatus.pending, (s) => { s.busy = true; s.error = ''; s.message = ''; })
      .addCase(changeClinicStatus.fulfilled, (s, a) => {
        const { id, status, summary } = a.payload;
        const clinic = s.items.find((c) => c.id === id);
        if (clinic) { clinic.status = status; clinic.isActive = status === 'APPROVED'; }
        s.summary = summary; s.busy = false; s.message = `Clinic ${status.toLowerCase()}.`;
      })
      .addCase(changeClinicStatus.rejected, (s, a) => { s.busy = false; s.error = a.error.message ?? 'Could not update clinic.'; });
  },
});

export default slice.reducer;