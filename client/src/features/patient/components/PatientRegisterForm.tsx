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
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={busy}
              onClick={() => {
                if (!busy) window.location.assign(authService.getGoogleAuthUrl('signup'));
              }}
            >
              Sign up with Google
            </Button>
            <div className="my-1 flex items-center gap-3 text-[11px] text-[#858997]" aria-hidden="true">
              <span className="h-px flex-1 bg-[#e5e7eb]" />
              <span>or use email</span>
              <span className="h-px flex-1 bg-[#e5e7eb]" />
            </div>
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
          </>
        ) : (
          <>
            <p className="m-0 text-[13px] text-[#686d7b]">
              Verification code sent to <strong>{email}</strong>
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
          </>
        )}

        <AuthSubmitButton busy={busy}>
          {otp.verifying ? "Verify email" : "Create account"}
        </AuthSubmitButton>
      </Form>
    </>
  );
}
