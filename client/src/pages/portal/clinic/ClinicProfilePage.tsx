import { useEffect, useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { Notice } from '@/components/atoms/Notice';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicProfileForm } from '@/features/clinic/components/ClinicProfileForm';
import { clinicService } from '@/features/clinic/services/clinicService';
import { patchClinic } from '@/features/clinic/store/clinicSlice';
import { useAction } from '@/shared/hooks/useAction';
import type { ClinicProfile } from '@/shared/types';
import { useAppDispatch } from '@/store/hooks';
import { normalizePhone, validatePhone } from '@/shared/utils/validators';

export default function ClinicProfilePage() {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const { busy, error, message, setError, run } = useAction();

  useEffect(() => {
    void run(async () => setProfile(await clinicService.getProfile()), { fallback: 'Could not load clinic profile.' });
  }, [run]);

  const saveProfile = (values: ClinicProfile) => {
    if (values.name.trim().length < 2 || values.name.trim().length > 150) return setError('Clinic name must be between 2 and 150 characters long.');
    const contactEmail = values.contactEmail?.trim();
    if (!contactEmail || contactEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return setError('Enter a valid clinic contact email address (254 characters or fewer).');
    const phone = values.phone?.trim() ? normalizePhone(values.phone) : null;
    if (values.phone?.trim() && !validatePhone(values.phone)) return setError('Enter a phone number with 7 to 15 digits. Use only digits, an optional leading +, spaces, parentheses, or hyphens.');
    if (values.registrationNumber?.trim().length && values.registrationNumber.trim().length > 100) return setError('Registration number must be 100 characters or fewer.');

    void run(async () => {
      const updated = await clinicService.updateProfile({
        name: values.name.trim(),
        clinicType: values.clinicType?.trim() || null,
        description: values.description?.trim() || null,
        address: values.address?.trim(),
        city: values.city?.trim(),
        state: values.state?.trim(),
        pincode: values.pincode?.trim(),
        phone,
        contactEmail: contactEmail.toLowerCase(),
        registrationNumber: values.registrationNumber?.trim(),
      });
      setProfile(updated);
      dispatch(patchClinic(updated));
    }, { success: 'Clinic profile saved.', fallback: 'Could not save the clinic profile.' });
  };

  return (
    <>
      <Notices error={error} message={message} />
      {profile?.rejectionReason ? <Notice tone="error"><strong>Application rejected</strong><p className="mb-0 mt-1">{profile.rejectionReason}</p></Notice> : null}
      {profile?.setupStatus === 'PENDING_VERIFICATION' ? <Notice tone="warning">Your application is under review. Profile edits are disabled until a decision is made.</Notice> : null}
      {profile ? (
        <Card className="pb-5">
          <SectionHeading title="Clinic profile" description="Manage the contact and registration details for your clinic." />
          <ClinicProfileForm initial={profile} busy={busy || profile.setupStatus === 'PENDING_VERIFICATION'} onSave={saveProfile} />
        </Card>
      ) : busy ? <Card className="p-[18px] text-sm text-[#777c8a]">Loading clinic profile...</Card> : null}
    </>
  );
}
