import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Role = 'patient' | 'doctor' | 'clinic_admin' | 'super_admin' | 'staff';

export const normalizeRole = (role: string): Role => {
  switch (role.toUpperCase()) {
    case 'SUPER_ADMIN':
      return 'super_admin';
    case 'CLINIC_ADMIN':
      return 'clinic_admin';
    case 'DENTIST':
    case 'DOCTOR':
      return 'doctor';
    case 'RECEPTIONIST':
    case 'STAFF':
      return 'staff';
    case 'PATIENT':
    default:
      return 'patient';
  }
};

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinicId?: string | null;
  status?: string;
}

interface AuthState {
  user: UserProfile | null;
  sessionValidated: boolean;
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  accessToken: string | null;
  refreshToken: string | null;
}

const storageKey = 'chirikaro-auth';

const readStoredAuth = (): Partial<AuthState> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(storageKey);
    return rawValue ? (JSON.parse(rawValue) as Partial<AuthState>) : {};
  } catch {
    window.localStorage.removeItem(storageKey);
    return {};
  }
};

const storedAuth = readStoredAuth();

const initialState: AuthState = {
  user: storedAuth.user ?? null,
  sessionValidated: false,
  sidebarOpen: true,
  theme: storedAuth.theme ?? 'light',
  accessToken: storedAuth.accessToken ?? null,
  refreshToken: storedAuth.refreshToken ?? null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<UserProfile | null>) => {
      state.user = action.payload;
    },
    setSessionValidated: (state) => {
      state.sessionValidated = true;
    },
    setAuthSession: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string } | null>,
    ) => {
      state.accessToken = action.payload?.accessToken ?? null;
      state.refreshToken = action.payload?.refreshToken ?? null;
      state.sessionValidated = false;
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.sessionValidated = false;
    },
  },
});

export const { setUser, setSessionValidated, setAuthSession, toggleSidebar, toggleTheme, logout } = authSlice.actions;
export default authSlice.reducer;
