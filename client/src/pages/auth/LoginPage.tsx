import { Link, Navigate, useParams } from 'react-router-dom';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { SignInForm } from '@/components/organisms/SignInForm';
import { loginRole, type LoginRoleKey } from '@/shared/constants/roles';

export default function LoginPage() {
  const { role: param } = useParams();

  const isValidRole =
    !!param &&
    Object.hasOwn(loginRole, param) &&
    param !== 'super-admin';

  if (!isValidRole) {
    return <Navigate to="/" replace />;
  }

  const role = param as LoginRoleKey;;

  const intro = role === 'patient'
    ? 'Use your patient account to continue.'
    : role === 'clinic'
      ? 'Use your clinic account to continue.'
      : `Use the ${role} account linked to your clinic invitation.`;

  const actionText = role === 'patient'
    ? (
      <>
        <span>Need a patient account?</span>{' '}
        <Link to="/register/patient">Create one</Link>
      </>
    )
    : role === 'clinic'
      ? (
        <>
          <span>Need to register your clinic?</span>{' '}
          <Link to="/register/clinic">Start onboarding</Link>
        </>
      )
      : (
        <span>Team accounts are created through a clinic invitation.</span>
      );

  return (
    <AuthTemplate
      kicker="SECURE ACCESS"
      title={`Sign in as ${role}`}
      intro={intro}
      actionText={actionText}
    >
      <SignInForm
        emailPlaceholder={role === 'clinic' ? 'owner@clinic.com' : undefined}
      />
    </AuthTemplate>
  );
}