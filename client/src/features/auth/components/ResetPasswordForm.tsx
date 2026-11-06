import { useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Form } from "@components/atoms/Form";
import { TextField } from "@components/molecules/FormField";
import { PasswordField } from "@components/molecules/PasswordField";
import { AuthSubmitButton } from "@components/molecules/AuthSubmitButton";
import { Notices } from "@components/molecules/Notices";
import { useAction } from "@shared/hooks/useAction";
import { authService } from "@/features/auth/services/authService";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);

  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const navigate = useNavigate();

  const { busy, error, message, setMessage, run } = useAction();

  const submit = (e: FormEvent) => {
    e.preventDefault();

    void run(
      async () => {
        if (!token) {
          throw new Error("Invalid or missing reset token.");
        }

        if (password.length < 8) {
          throw new Error("Password must contain at least 8 characters.");
        }

        if (password !== confirm) {
          throw new Error("Passwords do not match.");
        }

        await authService.resetPassword(
          token,
          password
        );

        setPassword("");
        setConfirm("");

        setMessage(
          "Your password has been reset successfully. Redirecting you to the login page...",
        );

        setSuccess(true);

        setTimeout(() => {
          navigate("/login/patient", { replace: true });
        }, 2500);
      },
      {
        fallback: "Unable to reset your password. Please try again.",
      },
    );
  };

  return (
    <>
      <Notices error={error} message={message} />

      {!success && (
        <Form onSubmit={submit}>
          <PasswordField
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <TextField
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Enter your password again"
            autoComplete="new-password"
            minLength={8}
            required
          />

          <AuthSubmitButton busy={busy}>
            Reset password
          </AuthSubmitButton>
        </Form>
      )}
    </>
  );
}