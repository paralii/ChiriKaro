import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Role =
  | "PATIENT"
  | "DOCTOR"
  | "CLINIC_ADMIN"
  | "SUPER_ADMIN"
  | "STAFF";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId?: string | null;
}

interface AuthState {
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
    },

    setAuthSession: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      } | null>,
    ) => {
      state.accessToken = action.payload?.accessToken ?? null;
      state.refreshToken = action.payload?.refreshToken ?? null;
    },

    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
    },
  },
});

export const { setUser, setAuthSession, logout } = authSlice.actions;
export default authSlice.reducer;
