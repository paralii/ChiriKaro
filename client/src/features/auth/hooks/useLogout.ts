import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/features/auth/store/authSlice';
import { authService } from '@/features/auth/services/authService';

export function useLogout() {
  const dispatch = useAppDispatch();
  const authenticated = useAppSelector((s) => Boolean(s.auth.user));
  return async () => {
    if (authenticated) {
      try { await authService.logout(null); } catch { /* clear local session regardless */ }
    }
    dispatch(logout());
  };
}
