import { useEffect, useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicProfileForm } from '@/components/organisms/ClinicProfileForm';
import { SpecializationsForm } from '@/components/organisms/SpecializationsForm';
import { WorkingHoursForm } from '@/components/organisms/WorkingHoursForm';
import { DocumentUploader } from '@/components/organisms/DocumentUploader';
import { defaultHours } from '@/constants/schedule';
import { useAction } from '@/hooks/useAction';
import { clinicService } from '@/services/clinicService';
import { openSignedUrl, uploadToSignedUrl } from '@/services/storageService';
import { useAppDispatch } from '@/store/hooks';
import { patchClinic } from '@/store/slices/clinicSlice';
import { findInvalidHours, parseList } from '@/utils/doctor';
import type { ClinicDocument, ClinicProfile } from '@/types';

export default function ClinicSetupPage() {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const { busy, error, message, setError, run } = useAction();

  useEffect(() => {
    void run(async () => {
      const saved = await clinicService.getProfile();
      setProfile({ ...saved, workingHours: saved.workingHours?.length ? saved.workingHours : defaultHours });
    }, { fallback: 'Could not load clinic setup.' });
  }, [run]);

  const merge = (patch: Partial<ClinicProfile>) => setProfile((c) => (c ? { ...c, ...patch } : c));

  const saveProfile = (v: ClinicProfile) => {
    if (v.name.trim().length < 2) return setError('Clinic name must be at least 2 characters long.');
    if (!v.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.contactEmail)) return setError('Enter a valid clinic contact email address.');
    void run(async () => {
      const updated = await clinicService.updateProfile({
        name: v.name.trim(), description: v.description?.trim(), address: v.address?.trim(), city: v.city?.trim(), state: v.state?.trim(),
        pincode: v.pincode?.trim(), phone: v.phone?.trim(), contactEmail: v.contactEmail!.trim().toLowerCase(),
        registrationNumber: v.registrationNumber?.trim(), clinicType: v.clinicType?.trim(),
      });
      merge(updated);
      dispatch(patchClinic({ name: updated.name }));
    }, { success: 'Clinic profile saved.', fallback: 'Could not save the clinic profile.' });
  };

  const saveSpecializations = (text: string) =>
    void run(async () => merge({ specializations: await clinicService.saveSpecializations(parseList(text)) }), { success: 'Clinic specializations saved.', fallback: 'Could not save specializations.' });

  const saveHours = (hours: ClinicProfile['workingHours']) => {
    const invalid = findInvalidHours(hours);
    if (invalid) return setError(`${invalid.day}: closing time must be later than opening time.`);
    void run(async () => merge({ workingHours: await clinicService.saveWorkingHours(hours) }), { success: 'Clinic working hours saved.', fallback: 'Could not save working hours.' });
  };

  const upload = (type: string, file: File) =>
    void run(async () => {
      const { key, uploadUrl } = await clinicService.getUploadUrl(file);
      await uploadToSignedUrl(uploadUrl, file);
      merge({ documents: (await clinicService.addDocument(type, key)) as ClinicDocument[] });
    }, { success: `${type} uploaded and saved.`, fallback: 'Could not upload this document.' });

  const open = (type: string) =>
    void run(async () => openSignedUrl((await clinicService.getDocumentUrl(type)).url), { fallback: 'Could not open the document.' });

  return (
    <div className="grid gap-[18px] [&>section]:mt-0">
      <Notices error={error} message={message} />
      {profile ? (
        <>
          <Card className="pb-5"><SectionHeading title="Clinic profile" description="Keep your practice details accurate for your team and patients." /><ClinicProfileForm initial={profile} busy={busy} onSave={saveProfile} /></Card>
          <Card className="pb-5"><SectionHeading title="Specializations" description="List the services your clinic provides." /><SpecializationsForm initial={profile.specializations} busy={busy} onSave={saveSpecializations} /></Card>
          <Card className="pb-5"><SectionHeading title="Working hours" description="Set the hours patients can contact your clinic." /><WorkingHoursForm initial={profile.workingHours} busy={busy} onSave={saveHours} /></Card>
          <Card className="pb-5">
            <SectionHeading title="Clinic documents" description="Private PDF, JPG, or PNG files up to 10 MB." />
            <DocumentUploader types={['Clinic registration', 'Operating license', 'Insurance certificate', 'Other']} documents={profile.documents} busy={busy} onUpload={upload} onOpen={open} />
          </Card>
        </>
      ) : null}
    </div>
  );
}