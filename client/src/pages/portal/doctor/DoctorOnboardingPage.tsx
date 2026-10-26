import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Notice } from '@/components/atoms/Notice';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { StepTabs } from '@/components/molecules/StepTabs';
import { WelcomeBand } from '@/components/molecules/WelcomeBand';
import { DoctorProfessionalForm } from '@/components/organisms/DoctorProfessionalForm';
import { DocumentUploader } from '@/components/organisms/DocumentUploader';
import { WorkingHoursForm } from '@/components/organisms/WorkingHoursForm';
import { DoctorAvailabilityStep } from '@/components/organisms/DoctorAvailabilityStep';
import { DoctorReviewStep } from '@/components/organisms/DoctorReviewStep';
import { defaultHours } from '@/constants/schedule';
import { useAction } from '@/hooks/useAction';
import { doctorService } from '@/services/doctorService';
import { openSignedUrl, uploadToSignedUrl } from '@/services/storageService';
import { emptyDoctorProfile, findInvalidHours, findResumeStep } from '@/utils/doctor';
import { phonePattern } from '@/utils/validators';
import type { DoctorProfile, Slot } from '@/types';

const steps = ['Professional details', 'Documents', 'Working hours', 'Availability', 'Review'];
const docTypes = ['Professional license', 'Qualification certificate', 'Identity document', 'Additional certificate'];

export default function DoctorOnboardingPage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [step, setStep] = useState(0);
  const [slots, setSlots] = useState<Slot[]>([]);
  const { busy, error, message, setError, run } = useAction();

  useEffect(() => {
    void run(async () => {
      const [saved, config] = await Promise.all([doctorService.getProfile(), doctorService.getSlotConfig()]);
      const loaded = { ...emptyDoctorProfile, ...saved, ...config, workingHours: saved.workingHours?.length ? saved.workingHours : defaultHours };
      setProfile(loaded);
      setStep(findResumeStep(loaded));
    }, { fallback: 'Could not load your Doctor profile.' });
  }, [run]);

  const merge = (patch: Partial<DoctorProfile>) => setProfile((c) => (c ? { ...c, ...patch } : c));

  const saveProfessional = (values: DoctorProfile) => {
    if (values.phone && !phonePattern.test(values.phone)) return setError('Enter a valid phone number, including country code if needed.');
    void run(async () => {
      merge(await doctorService.patchProfile({ ...values, yearsOfExperience: values.yearsOfExperience === null ? null : Number(values.yearsOfExperience) }));
      setStep(1);
    }, { success: 'Professional profile saved.', fallback: 'Could not save your profile.' });
  };

  const saveHours = (hours: DoctorProfile['workingHours']) => {
    const invalid = findInvalidHours(hours);
    if (invalid) return setError(`${invalid.day}: closing time must be later than opening time.`);
    void run(async () => { merge(await doctorService.saveAvailability(hours)); setStep(3); }, { success: 'Working hours saved.', fallback: 'Could not save working hours.' });
  };

  const saveSlotConfig = (v: { slotDuration: number; bufferMinutes: number }) =>
    void run(async () => { merge(await doctorService.saveSlotConfig(v)); setStep(4); }, { success: 'Availability settings saved.', fallback: 'Could not save availability settings.' });

  const upload = (type: string, file: File) =>
    void run(async () => {
      const { key, uploadUrl } = await doctorService.getUploadUrl(file);
      await uploadToSignedUrl(uploadUrl, file);
      merge(await doctorService.addDocument(type, key));
    }, { success: `${type} uploaded and saved.`, fallback: 'Could not upload this document.' });

  const generate = () =>
    void run(async () => { const result = await doctorService.generateSlots(); setSlots(result); return result; },
      { success: (r) => `${r.length} availability slots generated from your working hours.`, fallback: 'Could not generate availability.' });

  const submitForReview = () =>
    void run(async () => {
      const r = await doctorService.submitVerification();
      merge({ verificationStatus: r.verificationStatus, onboardingProgress: 100, rejectionReason: null });
    }, { success: 'Your profile has been submitted to your Clinic Admin for review.', fallback: 'Could not submit your profile.' });

  const back = (to: number) => <div className="flex justify-between gap-2.5 px-[18px] pt-3.5"><Button type="button" variant="secondary" disabled={busy} onClick={() => setStep(to)}>Back</Button></div>;

  return (
    <div className="grid gap-[18px] [&>section]:mt-0">
      <Notices error={error} message={message} />
      {profile ? (
        <>
          {profile.verificationStatus === 'REJECTED' && profile.rejectionReason ? <Notice tone="error"><strong>Changes requested</strong><p>{profile.rejectionReason}</p></Notice> : null}
          <WelcomeBand className="mb-0.5" pill={profile.verificationStatus.replaceAll('_', ' ')} title={`Profile completion: ${profile.onboardingProgress}%`} description="Complete each step, then send your profile to the Clinic Admin for review." />
          <StepTabs steps={steps} active={step} onSelect={setStep} />

          {step === 0 ? <Card className="pb-5"><SectionHeading title="Professional information" description="These details appear in your Clinic workspace." /><DoctorProfessionalForm initial={profile} busy={busy} onSave={saveProfessional} /></Card> : null}

          {step === 1 ? (
            <Card className="pb-5">
              <SectionHeading title="Professional documents" description="Upload at least three PDF, JPG, or PNG files up to 10 MB each." />
              <DocumentUploader types={docTypes} documents={profile.documents} busy={busy} showStatus onUpload={upload}
                onOpen={(t) => void run(async () => openSignedUrl((await doctorService.getDocumentUrl(t)).url), { fallback: 'Could not open this document.' })} />
              <div className="flex justify-between gap-2.5 px-[18px] pt-3.5 max-md:flex-wrap">
                <Button type="button" variant="secondary" onClick={() => setStep(0)}>Back</Button>
                <Button type="button" onClick={() => setStep(2)}>Continue to working hours</Button>
              </div>
            </Card>
          ) : null}

          {step === 2 ? (
            <Card className="pb-5">
              <SectionHeading title="Working hours" description="Set the hours used to generate your availability." />
              <WorkingHoursForm initial={profile.workingHours} busy={busy} onSave={saveHours} startLabel="Starts" endLabel="Ends" submitLabel="Save and continue" />
              {back(1)}
            </Card>
          ) : null}

          {step === 3 ? (
            <Card className="pb-5">
              <SectionHeading title="Availability" description={<>Clinic Admin-configured consultation fee: <strong>{profile.consultationFee == null ? 'Not set yet' : profile.consultationFee}</strong></>} />
              <DoctorAvailabilityStep slotDuration={profile.slotDuration} bufferMinutes={profile.bufferMinutes} slots={slots} busy={busy} onSaveConfig={saveSlotConfig} onGenerate={generate} />
              {back(2)}
            </Card>
          ) : null}

          {step === 4 ? (
            <Card className="pb-5">
              <SectionHeading title="Review and submit" description={<>Current status: <strong>{profile.verificationStatus.replaceAll('_', ' ')}</strong>. Your Clinic Admin will review your professional profile and documents.</>} />
              <DoctorReviewStep profile={profile} busy={busy} onSubmit={submitForReview} />
              {back(3)}
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}