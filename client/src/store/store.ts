import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/store/authSlice';
import adminClinicsReducer from '../features/admin/store/adminClinicsSlice';
import clinicReducer from '../features/clinic/store/clinicSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    adminClinics: adminClinicsReducer,
    clinic: clinicReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;