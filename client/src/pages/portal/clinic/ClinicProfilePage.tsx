import { useEffect, useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicProfileForm } from '@/features/clinic/components/ClinicProfileForm';
import { clinicService } from '@/features/clinic/services/clinicService';
import { patchClinic } from '@/features/clinic/store/clinicSlice';
import { useAction } from '@/shared/hooks/useAction';
import type { ClinicProfile } from '@/shared/types';
import { useAppDispatch } from '@/store/hooks';

export default function ClinicProfilePage() {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const { busy, error, message, setError, run } = useAction();

  useEffect(() => {
    void run(async () => setProfile(await clinicService.getProfile()), { fallback: 'Could not load clinic profile.' });
  }, [run]);

  const saveProfile = (values: ClinicProfile) => {
    if (values.name.trim().length < 2) return setError('Clinic name must be at least 2 characters long.');
    const contactEmail = values.contactEmail?.trim();
    if (!contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) return setError('Enter a valid clinic contact email address.');

    void run(async () => {
      const updated = await clinicService.updateProfile({
        name: values.name.trim(),
        address: values.address?.trim(),
        city: values.city?.trim(),
        state: values.state?.trim(),
        pincode: values.pincode?.trim(),
        phone: values.phone?.trim(),
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
      {profile ? (
        <Card className="pb-5">
          <SectionHeading title="Clinic profile" description="Manage the contact and registration details for your clinic." />
          <ClinicProfileForm initial={profile} busy={busy} onSave={saveProfile} profileOnly />
        </Card>
      ) : busy ? <Card className="p-[18px] text-sm text-[#777c8a]">Loading clinic profile...</Card> : null}
    </>
  );
}
