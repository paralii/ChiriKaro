import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicProfileForm } from '@/features/clinic/components/ClinicProfileForm';
import { SpecializationsForm } from '@/features/clinic/components/SpecializationsForm';
import { WorkingHoursForm } from '@/features/clinic/components/WorkingHoursForm';
import { DocumentUploader } from '@/features/doctor/components/DocumentUploader';
import { defaultHours } from '@/shared/constants/schedule';
import { useAction } from '@/shared/hooks/useAction';
import { clinicService } from '@/features/clinic/services/clinicService';
import { openSignedUrl } from '@/services/storageService';
import { useAppDispatch } from '@/store/hooks';
import { patchClinic } from '@/features/clinic/store/clinicSlice';
import { findInvalidHours, parseList } from '@/shared/utils/doctor';
import type { ClinicProfile } from '@/shared/types';

const normalizeWorkingHours = (value: unknown): ClinicProfile['workingHours'] => {
  const rows = Array.isArray(value) ? value.filter((row) => row && typeof row === 'object') as Array<Record<string, unknown>> : [];
  return defaultHours.map((fallback, index) => {
    const row = rows.find((item) => String(item.day ?? item.weekday ?? '').toLowerCase() === fallback.day.toLowerCase()) ?? rows[index];
    if (!row) return fallback;
    const start = row.startTime ?? row.start ?? row.openingTime;
    const end = row.endTime ?? row.end ?? row.closingTime;
    return {
      day: fallback.day,
      isOpen: typeof row.isOpen === 'boolean' ? row.isOpen : typeof row.open === 'boolean' ? row.open : fallback.isOpen,
      startTime: typeof start === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(start) ? start : fallback.startTime,
      endTime: typeof end === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(end) ? end : fallback.endTime,
    };
  });
};

export default function ClinicSetupPage() {
  const dispatch = useAppDispatch();
  const [profile, setProfile] = useState<ClinicProfile | null>(null);
  const { busy, error, message, setError, run } = useAction();

  useEffect(() => {
    void run(async () => {
      const saved = await clinicService.getProfile();
      setProfile({ ...saved, workingHours: normalizeWorkingHours(saved.workingHours) });
    }, { fallback: 'Could not load clinic setup.' });
  }, [run]);

  const merge = (patch: Partial<ClinicProfile>) => setProfile((c) => (c ? { ...c, ...patch } : c));

  const saveProfile = (v: ClinicProfile) => {
    if (![v.address, v.city, v.state, v.pincode].every((value) => value?.trim())) return setError('Complete the clinic address, city, state, and postal code.');
    void run(async () => {
      const updated = await clinicService.updateSetup({
        location: { address: v.address?.trim() ?? null, city: v.city?.trim() ?? null, state: v.state?.trim() ?? null, pincode: v.pincode?.trim() ?? null },
      });
      merge(updated);
      dispatch(patchClinic({ address: updated.address }));
    }, { success: 'Clinic location saved.', fallback: 'Could not save the clinic location.' });
  };

  const saveSpecializations = (text: string) => {
    const specializations = parseList(text);
    if (!specializations.length) return setError('Add at least one clinic specialization.');
    void run(async () => merge(await clinicService.updateSetup({ specializations })), { success: 'Clinic specializations saved.', fallback: 'Could not save specializations.' });
  };

  const saveHours = (hours: ClinicProfile['workingHours']) => {
    const invalid = findInvalidHours(hours);
    if (invalid) return setError(`${invalid.day}: closing time must be later than opening time.`);
    void run(async () => merge(await clinicService.updateSetup({ workingHours: hours })), { success: 'Clinic working hours saved.', fallback: 'Could not save working hours.' });
  };

  const upload = (type: string, file: File) =>
    void run(async () => {
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) throw new Error('Choose a PDF, JPG, or PNG file.');
      if (file.size > 10 * 1024 * 1024) throw new Error('The document must be 10 MB or smaller.');
      merge(await clinicService.uploadDocument(type, file));
    }, { success: `${type} uploaded and saved.`, fallback: 'Could not upload this document.' });

  const open = (type: string) =>
    void run(async () => {
      const url = URL.createObjectURL(await clinicService.getDocument(type));
      openSignedUrl(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }, { fallback: 'Could not open the document.' });

  const submitSetup = () => void run(async () => {
    const submitted = await clinicService.submitSetup();
    setProfile(submitted);
  }, { success: 'Clinic setup submitted for verification.', fallback: 'Could not submit clinic setup.' });

  const documents = Array.isArray(profile?.documents)
    ? profile.documents.filter((document) => document && typeof document === 'object' && typeof document.documentType === 'string' && document.documentType.trim().length > 0).map((document) => ({
      ...document,
      documentType: document.documentType.replaceAll('_', ' '),
    }))
    : [];

  return (
    <div className="grid gap-[18px] [&>section]:mt-0">
      <Notices error={error} message={message} />
      {!profile && busy ? <Card className="p-[18px] text-sm text-[#777c8a]">Loading clinic setup...</Card> : null}
      {profile ? (
        <>
          <Card className="pb-5"><SectionHeading title="Clinic location" description="Add the complete location required for clinic verification." /><ClinicProfileForm initial={profile} busy={busy} onSave={saveProfile} setupOnly /></Card>
          <Card className="pb-5"><SectionHeading title="Specializations" description="List the services your clinic provides." /><SpecializationsForm initial={profile.specializations} busy={busy} onSave={saveSpecializations} /></Card>
          <Card className="pb-5"><SectionHeading title="Working hours" description="Set the hours patients can contact your clinic." /><WorkingHoursForm initial={profile.workingHours} busy={busy} onSave={saveHours} /></Card>
          <Card className="pb-5">
            <SectionHeading title="Clinic documents" description="Private PDF, JPG, or PNG files up to 10 MB." />
            <DocumentUploader types={['Clinic registration', 'Operating license', 'Insurance certificate', 'Other']} documents={documents} busy={busy} onUpload={upload} onOpen={open} />
          </Card>
          <Card className="flex flex-wrap items-center justify-between gap-4 p-[18px]">
            <div><strong className="text-sm">Setup status: {profile.setupStatus?.replaceAll('_', ' ') ?? 'IN PROGRESS'}</strong><p className="mt-1 text-xs text-[#777b89]">Submit completed clinic information and documents for verification.</p></div>
            <Button disabled={busy || profile.setupStatus === 'PENDING_VERIFICATION' || profile.setupStatus === 'VERIFIED'} onClick={submitSetup}>
              {profile.setupStatus === 'PENDING_VERIFICATION' ? 'Submitted for verification' : profile.setupStatus === 'VERIFIED' ? 'Clinic setup verified' : busy ? 'Submitting...' : 'Submit for verification'}
            </Button>
          </Card>
        </>
      ) : null}
    </div>
  );
}
