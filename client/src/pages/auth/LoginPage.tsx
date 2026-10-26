import { Link, useParams } from 'react-router-dom';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { SignInForm } from '@/components/organisms/SignInForm';
import { displayRoles, loginRole, type LoginRoleKey } from '@/constants/roles';

export default function LoginPage() {
  const { role: param = 'patient' } = useParams();
  const role: LoginRoleKey = param in loginRole && param !== 'super-admin' ? (param as LoginRoleKey) : 'patient';
  const label = displayRoles[role].toLowerCase();

  const intro = role === 'patient' ? 'Use your patient account to continue.'
    : role === 'clinic' ? 'Use your clinic account to continue.'
    : `Use the ${label} account linked to your clinic invitation.`;

  const actionText = role === 'patient' ? <><span>Need a patient account?</span> <Link to="/register/patient">Create one</Link></>
    : role === 'clinic' ? <><span>Need to register your clinic?</span> <Link to="/register/clinic">Start onboarding</Link></>
    : <span>Team accounts are created through a clinic invitation.</span>;

  return (
    <AuthTemplate kicker="SECURE ACCESS" title={`Sign in as ${label}`} intro={intro} actionText={actionText}>
      <SignInForm role={role} emailPlaceholder={role === 'clinic' ? 'owner@clinic.com' : undefined} />
    </AuthTemplate>
  );
}