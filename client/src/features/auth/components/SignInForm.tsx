import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Form } from "@/components/atoms/Form";
import { TextField } from "@/components/molecules/FormField";
import { PasswordField } from "@/components/molecules/PasswordField";
import { AuthSubmitButton } from "@/components/molecules/AuthSubmitButton";
import { Notices } from "@/components/molecules/Notices";
import { Button } from "@/components/atoms/Button";
import { useLogin } from "@/features/auth/hooks/useLogin";
import { authService } from "@/features/auth/services/authService";

export function SignInForm({
  emailPlaceholder = "you@example.com",
  extras = true,
  google = true,
}: {
  emailPlaceholder?: string;
  extras?: boolean;
  google?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, busy, error } = useLogin();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void login(email, password);
  };

  return (
    <>
      <Notices error={error} />

      <Form onSubmit={submit}>
        <div className="space-y-4">
          <TextField
            label="Email address"
            type="email"
            maxLength={254}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={emailPlaceholder}
            autoComplete="email"
            required
          />

          <PasswordField
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="current-password"
            required
          />
        </div>

        {extras ? (
          <div className="mt-3 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-brand-deep transition-colors hover:text-brand"
            >
              Forgot password?
            </Link>
          </div>
        ) : null}

        <div className="mt-5 space-y-4">
          <AuthSubmitButton busy={busy}>Sign in</AuthSubmitButton>

          {google ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted">
                  OR CONTINUE WITH
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
                onClick={() => {
                  if (!busy) {
                    window.location.assign(
                      authService.getGoogleAuthUrl("signin"),
                    );
                  }
                }}
              >
                <svg
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  className="size-5 shrink-0"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.44 13.72 17.74 9.5 24 9.5Z"
                    transform="translate(0 4)"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.95 46.98 31.8 46.98 24.55Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.6.28-3.14.78-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19Z"
                    transform="translate(0 4)"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.94-2.13 15.91-5.8l-7.73-6c-2.14 1.45-4.89 2.3-8.18 2.3-6.26 0-11.56-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
                  />
                </svg>
                Google
              </Button>
            </div>
          ) : null}
        </div>
      </Form>
    </>
  );
}
