import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Form } from "@/components/atoms/Form";
import { TextButton } from "@/components/atoms/TextLink";
import { TextField } from "@/components/molecules/FormField";
import { PasswordField } from "@/components/molecules/PasswordField";
import { OtpField } from "@/components/molecules/OtpField";
import { AuthSubmitButton } from "@/components/molecules/AuthSubmitButton";
import { Notices } from "@/components/molecules/Notices";
import { Button } from "@/components/atoms/Button";

import { useAction } from "@/shared/hooks/useAction";
import { useOtpStep } from "@/features/auth/hooks/useOtpStep";

import { authService } from "@/features/auth/services/authService";

import { normalizeEmail, validateEmail, validatePassword } from "@/shared/utils/validators";

export function PatientRegisterForm({
  onVerifyingChange,
}: {
  onVerifyingChange?: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");

  const otp = useOtpStep(onVerifyingChange);

  const { busy, error, message, setError, setMessage, run } = useAction();

  const navigate = useNavigate();

  function validateDetails() {
    if (name.trim().length < 2 || name.trim().length > 100) {
      throw new Error("Name must be between 2 and 100 characters long.");
    }

    if (!validateEmail(email)) {
      throw new Error("A valid email address is required.");
    }

    if (!validatePassword(password)) {
      throw new Error("Use 8–128 characters with an uppercase letter, a number, and a special character. Spaces are not allowed.");
    }

    if (password !== confirmPassword) {
      throw new Error("Passwords do not match.");
    }
  }

  async function register() {
    validateDetails();

    await authService.register({
      name: name.trim(),
      email: normalizeEmail(email),
      password,
      role: "PATIENT",
    });

    otp.setVerifying(true);

    setMessage("A 6-digit verification code has been sent to your email.");
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();

    void run(
      async () => {
        if (!otp.verifying) {
          await register();
          return;
        }

        if (!/^\d{6}$/.test(otpCode.trim())) {
          throw new Error("Enter the 6-digit verification code.");
        }

        await authService.verifyOtp(normalizeEmail(email), otpCode.trim());

        navigate("/login/patient", { replace: true });
      },
      {
        fallback: "We could not complete registration. Please try again.",
      },
    );
  };

  return (
  <>
    <Notices error={error} message={message} />

    <Form onSubmit={submit}>
      {!otp.verifying ? (
        <>
          <div className="space-y-5">
            {/* Google Signup */}
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50"
              onClick={() => {
                if (!busy) {
                  window.location.assign(
                    authService.getGoogleAuthUrl('signup')
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

              Sign up with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted">
                OR REGISTER WITH EMAIL
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Registration Fields */}
            <div className="space-y-4">
              <TextField
                label="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                autoComplete="name"
                minLength={2}
                maxLength={100}
                required
              />

              <TextField
                label="Email address"
                type="email"
                maxLength={254}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setOtpCode("");
                }}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />

              <PasswordField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8+ characters, uppercase, number, symbol"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                title="Use 8–128 characters with an uppercase letter, a number, and a special character. Spaces are not allowed."
                required
              />

              <PasswordField
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                maxLength={128}
                required
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-4">
            <p className="m-0 text-sm text-muted">
              Verification code sent to{" "}
              <strong className="font-semibold text-foreground">
                {email}
              </strong>
            </p>

            <OtpField
              email={email}
              value={otpCode}
              onChange={setOtpCode}
              onRequest={async () => {
                await authService.resendOtp(normalizeEmail(email));
                setMessage("A new verification code has been sent.");
              }}
              onError={setError}
              disabled={busy}
              initiallySent
              initialCooldown={60}
            />

            <TextButton
              onClick={() => {
                otp.setVerifying(false);
                setError("");
                setMessage("");
              }}
            >
              Edit registration details
            </TextButton>
          </div>
        </>
      )}

      <div className="mt-5">
        <AuthSubmitButton busy={busy}>
          {otp.verifying ? "Verify email" : "Create account"}
        </AuthSubmitButton>
      </div>
    </Form>
  </>
);
}
