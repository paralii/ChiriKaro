import { Link } from 'react-router-dom';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { PasswordRecoveryForm } from '@/components/organisms/PasswordRecoveryForm';

export default function ForgotPasswordPage() {
  return (
    <AuthTemplate kicker="PASSWORD RECOVERY" title="Reset your password" intro="Enter your account email, verify the code, and choose a new password."
      actionText={<><span>Return to sign in?</span> <Link to="/login/patient">Back to login</Link></>}>
      <PasswordRecoveryForm />
    </AuthTemplate>
  );
}