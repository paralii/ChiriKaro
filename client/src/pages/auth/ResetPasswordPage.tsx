import { Link } from "react-router-dom";
import { AuthTemplate } from "@/components/templates/AuthTemplate";
import { ResetPasswordForm } from "@features/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthTemplate
      kicker="PASSWORD RECOVERY"
      title="Create a new password"
      intro="Enter your new password below to regain access to your account."
      actionText={
        <>
          <span>Remember your password?</span>{" "}
          <Link to="/login/patient">Back to login</Link>
        </>
      }
    >
      <ResetPasswordForm />
    </AuthTemplate>
  );
}