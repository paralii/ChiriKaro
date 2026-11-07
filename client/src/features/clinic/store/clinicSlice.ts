import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clinicService } from '@/features/clinic/services/clinicService';
import type { Clinic, ClinicDashboard } from '@/shared/types';

export const loadClinic = createAsyncThunk('clinic/load', () => clinicService.dashboard());

const slice = createSlice({
  name: 'clinic',
  initialState: { current: null as Clinic | null, dashboard: null as ClinicDashboard | null, busy: false, error: '' },
  reducers: {
    patchClinic(state, action: PayloadAction<Partial<Clinic>>) {
      if (state.current) state.current = { ...state.current, ...action.payload };
      if (state.dashboard) state.dashboard.clinic = { ...state.dashboard.clinic, ...action.payload };
    },
  },
  extraReducers: (b) => {
    b.addCase(loadClinic.pending, (s) => { s.busy = true; s.error = ''; })
      .addCase(loadClinic.fulfilled, (s, a) => { s.dashboard = a.payload; s.current = a.payload.clinic; s.error = ''; s.busy = false; })
      .addCase(loadClinic.rejected, (s, a) => { s.error = a.error.message ?? 'Could not load this workspace.'; s.busy = false; });
  },
});

export const { patchClinic } = slice.actions;
export default slice.reducer;
