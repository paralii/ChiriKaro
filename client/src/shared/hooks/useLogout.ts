import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';

export function useLogout() {
  const dispatch = useAppDispatch();
  const { accessToken, refreshToken } = useAppSelector((s) => s.auth);
  return async () => {
    if (accessToken) {
      try { await authService.logout(refreshToken); } catch { /* clear local session regardless */ }
    }
    dispatch(logout());
  };
}