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
  avatar?: string | null;
}

interface AuthState {
  user: UserProfile | null;
}
const persistedAuth = localStorage.getItem("chirikaro-auth");

const initialState: AuthState = {
  user: persistedAuth ? JSON.parse(persistedAuth).user : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
    },

    logout: (state) => {
      state.user = null;
    },
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;
