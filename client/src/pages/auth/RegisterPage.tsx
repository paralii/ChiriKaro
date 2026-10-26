import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AuthTemplate } from '@/components/templates/AuthTemplate';
import { PatientRegisterForm } from '@/components/organisms/PatientRegisterForm';
import { ClinicRegisterForm } from '@/components/organisms/ClinicRegisterForm';

export default function RegisterPage() {
  const { role } = useParams();
  const [verifying, setVerifying] = useState(false);

  if (role === 'clinic') {
    return (
      <AuthTemplate kicker="CLINIC ONBOARDING" title={verifying ? 'Verify your email' : 'Register your clinic'}
        intro={verifying ? 'Enter the 6-digit code we sent to submit your application.' : 'Share a few details to request access for your practice.'}
        actionText={<><span>Already have a clinic account?</span> <Link to="/login/clinic">Sign in</Link></>}>
        <ClinicRegisterForm onVerifyingChange={setVerifying} />
      </AuthTemplate>
    );
  }
  if (role !== 'patient') return <Navigate to="/register/patient" replace />;

  return (
    <AuthTemplate kicker="PATIENT ACCOUNT" title={verifying ? 'Verify your email' : 'Create your account'}
      intro={verifying ? 'Enter the 6-digit code we sent to finish creating your account.' : 'Keep your dental care details close at hand.'}
      actionText={<><span>Already have an account?</span> <Link to="/login/patient">Sign in</Link></>}>
      <PatientRegisterForm onVerifyingChange={setVerifying} />
    </AuthTemplate>
  );
}