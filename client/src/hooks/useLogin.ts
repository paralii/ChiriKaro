import { useNavigate } from 'react-router-dom';
import { useAction } from './useAction';
import { useAppDispatch } from '@/store/hooks';
import { normalizeRole, setAuthSession, setUser } from '@/store/slices/authSlice';
import { authService } from '@/services/authService';
import { loginRole, type LoginRoleKey } from '@/constants/roles';
import { normalizeEmail, validateEmail } from '@/utils/validators';

export function useLogin(role: LoginRoleKey) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { busy, error, run } = useAction();

  const login = (email: string, password: string) =>
    run(async () => {
      if (!validateEmail(email)) throw new Error('Enter a valid email address.');
      if (!password) throw new Error('Password is required.');
      const result = await authService.login({ email: normalizeEmail(email), password, role: loginRole[role] });
      dispatch(setUser({ ...result.user, role: normalizeRole(result.user.role) }));
      dispatch(setAuthSession({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      navigate('/app/dashboard', { replace: true });
    }, { fallback: 'We could not complete that request. Please try again.' });

  return { login, busy, error };
}