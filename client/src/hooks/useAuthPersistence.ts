import { useEffect } from 'react';
import { useAppSelector } from '@/store/hooks';

export function useAuthPersistence() {
  const { user, accessToken, refreshToken } = useAppSelector((s) => s.auth);
  useEffect(() => {
    if (user) window.localStorage.setItem('chirikaro-auth', JSON.stringify({ user, accessToken, refreshToken }));
    else window.localStorage.removeItem('chirikaro-auth');
  }, [user, accessToken, refreshToken]);
}