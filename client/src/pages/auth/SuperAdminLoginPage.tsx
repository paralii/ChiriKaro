import { Link } from 'react-router-dom';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { SignInForm } from '@/components/organisms/SignInForm';

export default function SuperAdminLoginPage() {
  return (
    <AuthTemplate kicker="SUPER ADMIN" title="Sign in as super admin" intro="Use your administrator credentials to review clinics and manage workspace access."
      actionText={<><span>Back to patient access?</span> <Link to="/login/patient">Patient login</Link></>}>
      <SignInForm role="super-admin" emailPlaceholder="admin@chirikaro.com" extras={false} />
    </AuthTemplate>
  );
}