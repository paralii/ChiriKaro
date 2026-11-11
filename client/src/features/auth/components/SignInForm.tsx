import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Form } from '@/components/atoms/Form';
import { TextField } from '@/components/molecules/FormField';
import { PasswordField } from '@/components/molecules/PasswordField';
import { AuthSubmitButton } from '@/components/molecules/AuthSubmitButton';
import { Notices } from '@/components/molecules/Notices';
import { Button } from '@/components/atoms/Button';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { authService } from '@/features/auth/services/authService';

export function SignInForm({ emailPlaceholder = 'you@example.com', extras = true, google = true }: { emailPlaceholder?: string; extras?: boolean; google?: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, busy, error } = useLogin();

  const submit = (e: FormEvent) => { e.preventDefault(); void login(email, password); };

  return (
    <>
      <Notices error={error} />
      <Form onSubmit={submit}>
        {google ? <Button
          type="button"
          variant="secondary"
          className="mb-4 w-full"
          disabled={busy}
          onClick={() => {
            if (!busy) window.location.assign(authService.getGoogleAuthUrl('signin'));
          }}
        >
          Continue with Google
        </Button> : null}
        <TextField label="Email address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={emailPlaceholder} autoComplete="email" required />
        <PasswordField value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="current-password" required />
        {extras ? (
          <div className="-mt-px flex items-center justify-between text-[11px]">
            {/* <label className="flex cursor-pointer items-center gap-1.5 text-[#656a79]"><input type="checkbox" className="size-3.5 accent-brand" /> <span>Remember me</span></label> */}
            <Link to="/forgot-password" className="font-semibold text-brand-deep">Forgot password?</Link>
          </div>
        ) : null}
        <AuthSubmitButton busy={busy}>Sign in</AuthSubmitButton>
      </Form>
    </>
  );
}
