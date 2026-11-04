import { Link } from "react-router-dom";
import { AuthTemplate } from "@/components/templates/AuthTemplate";
import { ForgotPasswordForm } from "@features/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AuthTemplate
      kicker="PASSWORD RECOVERY"
      title="Forgot your password?"
      intro="Enter your account email and we'll send you a password reset link."
      actionText={
        <>
          <span>Return to sign in?</span>{" "}
          <Link to="/login/patient">Back to login</Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthTemplate>
  );
}