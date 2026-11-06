import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";

import { AuthTemplate } from "@/components/templates/AuthTemplate";
import { PatientRegisterForm } from "@/features/patient/components/PatientRegisterForm";
import { ClinicRegisterForm } from "@/features/clinic/components/ClinicRegisterForm";

export default function RegisterPage() {
  const { role } = useParams();
  const [verifying, setVerifying] = useState(false);

  if (role === "clinic") {
    return (
      <AuthTemplate
        kicker="CLINIC OWNER ACCOUNT"
        title={verifying ? "Verify your email" : "Create your account"}
        intro={
          verifying
            ? "Enter the 6-digit code we sent to your email."
            : "Create an account to register and manage your dental clinic."
        }
        actionText={
          <>
            <span>Already have an account?</span>{" "}
            <Link to="/login/clinic">Sign in</Link>
          </>
        }
      >
        <ClinicRegisterForm onVerifyingChange={setVerifying} />
      </AuthTemplate>
    );
  }

  if (role !== "patient") {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthTemplate
      kicker="PATIENT ACCOUNT"
      title={verifying ? "Verify your email" : "Create your account"}
      intro={
        verifying
          ? "Enter the 6-digit code we sent to your email."
          : "Create your account to manage your dental care."
      }
      actionText={
        <>
          <span>Already have an account?</span>{" "}
          <Link to="/login/patient">Sign in</Link>
        </>
      }
    >
      <PatientRegisterForm onVerifyingChange={setVerifying} />
    </AuthTemplate>
  );
}
