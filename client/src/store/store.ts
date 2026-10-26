import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import adminClinicsReducer from './slices/adminClinicsSlice';
import clinicReducer from './slices/clinicSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminClinics: adminClinicsReducer,
    clinic: clinicReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;