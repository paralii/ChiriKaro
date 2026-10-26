import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { clinicService } from '@/services/clinicService';
import type { Clinic } from '@/types';

export const loadClinic = createAsyncThunk('clinic/load', () => clinicService.dashboard());

const slice = createSlice({
  name: 'clinic',
  initialState: { current: null as Clinic | null, error: '' },
  reducers: {
    patchClinic(state, action: PayloadAction<Partial<Clinic>>) {
      if (state.current) state.current = { ...state.current, ...action.payload };
    },
  },
  extraReducers: (b) => {
    b.addCase(loadClinic.fulfilled, (s, a) => { s.current = a.payload; s.error = ''; })
      .addCase(loadClinic.rejected, (s, a) => { s.error = a.error.message ?? 'Could not load this workspace.'; });
  },
});

export const { patchClinic } = slice.actions;
export default slice.reducer;