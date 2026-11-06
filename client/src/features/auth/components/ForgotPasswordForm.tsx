import { useState, type FormEvent } from "react";
import { Form } from "@components/atoms/Form";
import { TextField } from "@components/molecules/FormField";
import { AuthSubmitButton } from "@components/molecules/AuthSubmitButton";
import { Notices } from "@components/molecules/Notices";
import { useAction } from "@shared/hooks/useAction";
import { authService } from "@/features/auth/services/authService";
import { normalizeEmail, validateEmail } from "@shared/utils/validators";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");

  const { busy, error, message, setMessage, run } = useAction();

  const submit = (e: FormEvent) => {
    e.preventDefault();

    void run(
      async () => {
        if (!validateEmail(email)) {
          throw new Error("A valid email address is required.");
        }

        await authService.forgotPassword(
          normalizeEmail(email),
        );

        setMessage(
          "If an account exists with this email, you will receive a password reset link shortly. Please check your inbox and spam folder.",
        );
      },
      {
        fallback: "Unable to process your request. Please try again.",
      },
    );
  };

  return (
    <>
      <Notices error={error} message={message} />

      <Form onSubmit={submit}>
        <TextField
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          required
        />

        <AuthSubmitButton busy={busy}>
          Send reset link
        </AuthSubmitButton>
      </Form>
    </>
  );
}