import { Card } from '@/components/atoms/Card';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { PatientProfileForm } from '@/features/patient/components/PatientProfileForm';
import { patientService } from '@/features/patient/services/patientService';
import { setUser } from '@/features/auth/store/authSlice';
import { useAction } from '@/shared/hooks/useAction';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function PatientProfilePage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user)!;
  const { busy, error, message, setError, run } = useAction();

  const save = (name: string, avatar: string) => {
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 100) return setError('Name must be between 2 and 100 characters long.');
    void run(async () => {
      const normalizedAvatar = avatar.trim();
      const profile = await patientService.updateProfile({ name: normalizedName, ...(normalizedAvatar ? { avatar: normalizedAvatar } : {}) });
      dispatch(setUser({ ...user, name: profile.name, avatar: profile.avatar }));
      return profile;
    }, { success: 'Patient profile saved.', fallback: 'Could not save your profile.' });
  };

  return (
    <>
      <Notices error={error} message={message} />
      <Card className="pb-5">
        <SectionHeading title="Your profile" description="Update the name and profile image for your patient account." />
        <PatientProfileForm name={user.name} email={user.email} avatar={user.avatar} busy={busy} onSave={save} />
      </Card>
    </>
  );
}
