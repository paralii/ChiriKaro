import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { InvitationAcceptForm } from '@/components/organisms/InvitationAcceptForm';

export default function AcceptInvitationPage() {
  const [role, setRole] = useState('');
  const isDoctor = role === 'DOCTOR';
  return (
    <AuthTemplate kicker="TEAM INVITATION" title={`Join as ${isDoctor ? 'a Doctor' : 'a Staff member'}`}
      intro="Your invitation verifies the email address. Create your account to access your clinic workspace."
      actionText={<><span>Already registered?</span> <Link to={isDoctor ? '/login/doctor' : '/login/staff'}>Go to role sign in</Link></>}>
      <InvitationAcceptForm onLoaded={setRole} />
    </AuthTemplate>
  );
}