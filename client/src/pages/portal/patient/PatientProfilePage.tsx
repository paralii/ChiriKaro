import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Dialog, DialogAction } from '@/components/atoms/Dialog';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { PatientProfileForm } from '@/features/patient/components/PatientProfileForm';
import { patientService } from '@/features/patient/services/patientService';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';
import { useLogout } from '@/features/auth/hooks/useLogout';
import { setUser } from '@/features/auth/store/authSlice';
import { useAction } from '@/shared/hooks/useAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function PatientProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user)!;
  const { busy, error, message, setError, run } = useAction();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const logout = useLogout();

  const save = (name: string, avatar: string | null) => {
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 100) return setError('Name must be between 2 and 100 characters long.');
    void run(async () => {
      const profile = await patientService.updateProfile({ name: normalizedName, avatar });
      dispatch(setUser({ ...user, name: profile.name, avatar: profile.avatar }));
      return profile;
    }, { success: 'Patient profile saved.', fallback: 'Could not save your profile.' });
  };

  const confirmLogout = async () => {
    if (logoutBusy) return;
    setLogoutBusy(true);
    await logout();
    setLogoutBusy(false);
    setLogoutOpen(false);
  };

  return (
    <>
      <Notices error={error} message={message} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
        <Card className="mt-0 overflow-hidden pb-5">
          <SectionHeading title="Personal information" description="Update the information your patient account currently supports." />
          <PatientProfileForm name={user.name} email={user.email} avatar={user.avatar} busy={busy} onSave={save} />
        </Card>
        <div className="grid content-start gap-4">
          <Card className="mt-0 overflow-hidden pb-5"><ChangePasswordForm /></Card>
          <Card className="mt-0 overflow-hidden">
            <SectionHeading title="Account settings" description="Manage access to your patient account." />
            <div className="grid gap-3 p-4 sm:p-5">
              <div><span className="block text-xs font-semibold uppercase tracking-wide text-text-muted">Sign-in email</span><p className="mb-0 mt-1 break-all text-sm font-medium text-text-primary">{user.email}</p><p className="mb-0 mt-1 text-xs text-text-muted">Email changes are not supported in this profile API.</p></div>
              <Button type="button" variant="secondary" className="justify-self-start" onClick={() => setLogoutOpen(true)}>Sign out</Button>
            </div>
          </Card>
        </div>
      </div>
      <Dialog open={logoutOpen} onClose={() => { if (!logoutBusy) setLogoutOpen(false); }} title="Sign out of ChiriKaro?" description="You will need to sign in again to access your patient portal." variant="warning" closeOnBackdrop={!logoutBusy} closeOnEscape={!logoutBusy} footer={<>
        <DialogAction variant="secondary" disabled={logoutBusy} onClick={() => setLogoutOpen(false)}>Stay signed in</DialogAction>
        <DialogAction disabled={logoutBusy} onClick={() => void confirmLogout()}>{logoutBusy ? 'Signing out…' : 'Sign out'}</DialogAction>
      </>}>
        <p className="m-0 text-sm text-text-secondary">Your account session will be ended on this device.</p>
      </Dialog>
    </>
  );
}
