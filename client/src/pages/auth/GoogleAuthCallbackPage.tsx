import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/features/auth/store/authSlice';
import { authService } from '@/features/auth/services/authService';
import { Notice } from '@/components/atoms/Notice';
import { TextLink } from '@/components/atoms/TextLink';

const destinations = {
  SUPER_ADMIN: '/app/dashboard',
  CLINIC_ADMIN: '/clinic/dashboard',
  DOCTOR: '/doctor/dashboard',
  STAFF: '/staff/dashboard',
  PATIENT: '/patient/dashboard',
} as const;

export default function GoogleAuthCallbackPage() {
  const [params] = useSearchParams();
  const [error, setError] = useState(() => params.get('error') ?? (params.get('success') === '1' ? '' : 'Google sign-in was cancelled or could not be completed.'));
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    let active = true;
    if (params.get('error') || params.get('success') !== '1') {
      return () => { active = false; };
    }

    void authService.getProfile()
      .then((response) => {
        if (!active) return;
        const profile = response as { data?: { id: string; name: string; email: string; role: keyof typeof destinations; clinicId?: string | null; avatar?: string | null } };
        if (!profile.data) throw new Error('Your signed-in profile could not be loaded.');
        dispatch(setUser(profile.data));
        navigate(destinations[profile.data.role], { replace: true });
      })
      .catch(() => {
        if (active) setError('Google sign-in could not be completed. Please try again.');
      });
    return () => { active = false; };
  }, [dispatch, navigate, params]);

  return (
    <main className="grid min-h-screen place-items-center bg-page p-4 sm:p-6">
      <section className="w-full max-w-md rounded-xl border border-border bg-surface-elevated p-6 text-center shadow-md sm:p-8">
        {error ? (
          <>
            <Notice tone="error" className="mb-5 text-left">{error}</Notice>
            <TextLink to="/register/patient" className="min-h-10 justify-center">Return to patient registration</TextLink>
          </>
        ) : <p role="status" className="m-0 text-base leading-relaxed text-text-secondary">Completing Google sign-up…</p>}
      </section>
    </main>
  );
}
