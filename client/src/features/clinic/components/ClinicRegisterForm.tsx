import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";

import { Form } from "@components/atoms/Form";
import { TextButton } from "@components/atoms/TextLink";
import { TextField } from "@components/molecules/FormField";
import { PasswordField } from "@components/molecules/PasswordField";
import { OtpField } from "@components/molecules/OtpField";
import { AuthSubmitButton } from "@components/molecules/AuthSubmitButton";
import { Notices } from "@components/molecules/Notices";

import { useAction } from "@shared/hooks/useAction";
import { useOtpStep } from "@/features/auth/hooks/useOtpStep";

import { authService } from "@/features/auth/services/authService";

import { normalizeEmail, validateEmail } from "@shared/utils/validators";

export function ClinicRegisterForm({
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
    if (name.trim().length < 2) {
      throw new Error("Owner name must be at least 2 characters long.");
    }

    if (!validateEmail(email)) {
      throw new Error("A valid email address is required.");
    }

    if (password.length < 8) {
      throw new Error("Password must contain at least 8 characters.");
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
      role: "CLINIC_ADMIN",
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

        navigate("/login/clinic", { replace: true });
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
            <TextField
              label="Owner's full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              minLength={2}
              required
            />

            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@clinic.com"
              autoComplete="email"
              required
            />

            <PasswordField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />

            <PasswordField
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
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
