import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Notice } from '@/components/atoms/Notice';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { DetailList } from '@/components/molecules/DetailList';
import { StepTabs } from '@/components/molecules/StepTabs';
import { WelcomeBand } from '@/components/molecules/WelcomeBand';
import { DoctorBasicForm } from '@/features/doctor/components/DoctorBasicForm';
import { DoctorProfessionalForm } from '@/features/doctor/components/DoctorProfessionalForm';
import { DoctorPracticeForm } from '@/features/doctor/components/DoctorPracticeForm';
import { DocumentUploader } from '@/features/doctor/components/DocumentUploader';
import { WorkingHoursForm } from '@/features/clinic/components/WorkingHoursForm';
import { defaultHours } from '@/shared/constants/schedule';
import { useAction } from '@/shared/hooks/useAction';
import { doctorService } from '@/features/doctor/services/doctorService';
import { openSignedUrl } from '@/services/storageService';
import { emptyDoctorOnboardingProfile, findInvalidHours, findResumeStep, toDisplayWorkingHours, toDoctorWorkingHours } from '@/shared/utils/doctor';
import type { DoctorOnboardingProfile, DoctorOnboardingStep, WorkingHour } from '@/shared/types';
import { useAppSelector } from '@/store/hooks';

const steps = ['Basic information', 'Professional details', 'Practice details', 'Documents', 'Review'];
const docTypes = ['Professional license', 'Qualification certificate', 'Identity document', 'Additional certificate'];

export default function DoctorOnboardingPage() {
  const user = useAppSelector((state) => state.auth.user)!;
  const [profile, setProfile] = useState<DoctorOnboardingProfile | null>(null);
  const [step, setStep] = useState(0);
  const { busy, error, message, setError, run } = useAction();
  const locked = profile?.onboardingStatus === 'PENDING_VERIFICATION' || profile?.onboardingStatus === 'VERIFIED';

  useEffect(() => {
    void run(async () => {
      const result = await doctorService.getOnboarding();
      if (result.profile) {
        const loaded = {
          ...result.profile,
          dateOfBirth: result.profile.dateOfBirth?.slice(0, 10) ?? null,
          onboardingStatus: result.onboardingStatus,
          workingHours: result.profile.workingHours ?? [],
        };
        setProfile(loaded);
        setStep(findResumeStep(loaded));
      } else {
        const [firstName = '', ...lastName] = user.name.trim().split(/\s+/);
        setProfile({ ...emptyDoctorOnboardingProfile, firstName, lastName: lastName.join(' ') });
        setStep(0);
      }
    }, { fallback: 'Could not load your doctor onboarding.' });
  }, [run, user.name]);

  const applyResponse = (result: Awaited<ReturnType<typeof doctorService.updateOnboarding>>) => {
    if (!result.profile) throw new Error('Doctor onboarding profile was not returned.');
    const updated = { ...result.profile, onboardingStatus: result.onboardingStatus, dateOfBirth: result.profile.dateOfBirth?.slice(0, 10) ?? null };
    setProfile(updated);
    return updated;
  };

  const saveStep = (kind: DoctorOnboardingStep, values: unknown, next: number) =>
    void run(async () => {
      const updated = applyResponse(await doctorService.updateOnboarding(kind, values));
      setStep(next);
      return updated;
    }, { success: 'Onboarding details saved.', fallback: 'Could not save onboarding details.' });

  const saveBasic = (values: Pick<DoctorOnboardingProfile, 'firstName' | 'lastName' | 'gender' | 'dateOfBirth'>) =>
    saveStep('basic', { ...values, firstName: values.firstName.trim(), lastName: values.lastName.trim() }, 1);

  const saveProfessional = (values: Pick<DoctorOnboardingProfile, 'professionalTitle' | 'qualifications' | 'yearsOfExperience' | 'registrationNumber' | 'registrationAuthority'>) => {
    if (!values.qualifications.length) return setError('Add at least one qualification.');
    void run(async () => {
      const updated = applyResponse(await doctorService.updateOnboarding('professional', {
        ...values,
        professionalTitle: values.professionalTitle?.trim(),
        registrationNumber: values.registrationNumber?.trim(),
        registrationAuthority: values.registrationAuthority?.trim(),
      }));
      setStep(2);
      return updated;
    }, { success: 'Professional details saved.', fallback: 'Could not save professional details.' });
  };

  const savePractice = (values: Pick<DoctorOnboardingProfile, 'specializations' | 'procedures'>) => {
    if (!values.specializations.length || !values.procedures.length) return setError('Add at least one specialization and procedure.');
    void run(async () => {
      const updated = applyResponse(await doctorService.updateOnboarding('practice', values));
      if (findResumeStep(updated) > 2) setStep(3);
      return updated;
    }, { success: 'Practice details saved.', fallback: 'Could not save practice details.' });
  };

  const saveHours = (hours: WorkingHour[]) => {
    const invalid = findInvalidHours(hours);
    if (invalid) return setError(`${invalid.day}: closing time must be later than opening time.`);
    if (!hours.some((hour) => hour.isOpen)) return setError('Open at least one working day.');
    void run(async () => {
      const updated = applyResponse(await doctorService.updateOnboarding('practice', { workingHours: toDoctorWorkingHours(hours) }));
      if (findResumeStep(updated) > 2) setStep(3);
      return updated;
    }, { success: 'Working hours saved.', fallback: 'Could not save working hours.' });
  };

  const upload = (type: string, file: File) => void run(async () => {
    if (!profile?.id) throw new Error('Save your basic information before uploading documents.');
    if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) throw new Error('Choose a PDF, JPG, or PNG file.');
    if (file.size > 10 * 1024 * 1024) throw new Error('Each document must be 10 MB or smaller.');
    const updated = applyResponse(await doctorService.uploadOnboardingDocument(type, file));
    if (findResumeStep(updated) === 4) setStep(4);
    return updated;
  }, { success: `${type} uploaded and saved.`, fallback: 'Could not upload this document.' });

  const openDocument = (type: string) => void run(async () => {
    const url = URL.createObjectURL(await doctorService.getOnboardingDocument(type));
    openSignedUrl(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, { fallback: 'Could not open this document.' });

  const selectStep = (next: number) => {
    if (profile && (next > findResumeStep(profile) || (!profile.id && next > 0))) return setError('Complete and save the previous onboarding steps first.');
    setStep(next);
  };

  const hours = profile?.workingHours.length ? toDisplayWorkingHours(profile.workingHours) : defaultHours;

  return (
    <div className="grid gap-[18px] [&>section]:mt-0">
      <Notices error={error} message={message} />
      {!profile && busy ? <Card className="p-[18px] text-sm text-[#777c8a]">Loading your onboarding profile...</Card> : null}
      {profile ? (
        <>
          {profile.onboardingStatus === 'REJECTED' && profile.rejectionReason ? <Notice tone="error"><strong>Changes requested</strong><p>{profile.rejectionReason}</p></Notice> : null}
          {locked ? <Notice tone="success">Your profile is {profile.onboardingStatus === 'VERIFIED' ? 'verified' : 'pending review'} and can no longer be edited.</Notice> : null}
          <WelcomeBand className="mb-0.5" pill={profile.onboardingStatus.replaceAll('_', ' ')} title={`Welcome, ${profile.firstName || user.name}.`} description="Complete and save each step. You can return later and continue from your last saved section."
            action={<Link to="/doctor/workspace"><Button type="button" variant="secondary" tabIndex={-1}>Workspace details</Button></Link>} />
          <StepTabs steps={steps} active={step} onSelect={selectStep} />

          {step === 0 ? <Card className="pb-5"><SectionHeading title="Basic information" description="Add the personal details for your clinic profile." /><DoctorBasicForm initial={profile} busy={busy || Boolean(locked)} onSave={saveBasic} /></Card> : null}

          {step === 1 ? <Card className="pb-5"><SectionHeading title="Professional details" description="Add your qualifications and professional registration information." /><DoctorProfessionalForm initial={profile} busy={busy || Boolean(locked)} onSave={saveProfessional} /></Card> : null}

          {step === 2 ? (
            <>
              <Card className="pb-5"><SectionHeading title="Practice details" description="List your specializations and procedures." /><DoctorPracticeForm initial={profile} busy={busy || Boolean(locked)} onSave={savePractice} /></Card>
              <Card className="pb-5"><SectionHeading title="Working hours" description="Set the hours you are available at this clinic." /><WorkingHoursForm initial={hours} busy={busy || Boolean(locked)} onSave={saveHours} submitLabel="Save working hours" /></Card>
            </>
          ) : null}

          {step === 3 ? (
            <Card className="pb-5">
              <SectionHeading title="Professional documents" description="Upload PDF, JPG, or PNG files up to 10 MB each." />
              <DocumentUploader types={docTypes} documents={profile.documents.map((document) => ({ ...document, documentType: document.documentType.replaceAll('_', ' ') }))}
                busy={busy || Boolean(locked)} showStatus onUpload={upload} onOpen={openDocument} />
              <div className="flex justify-between gap-2.5 px-[18px] pt-3.5"><Button type="button" variant="secondary" onClick={() => setStep(2)}>Back</Button></div>
            </Card>
          ) : null}

          {step === 4 ? (
            <Card className="pb-5">
              <SectionHeading title="Review your onboarding details" description="Check your saved information and return to any step to make changes." />
              <DetailList items={[
                ['Name', `${profile.firstName} ${profile.lastName}`.trim()],
                ['Gender', profile.gender?.replaceAll('_', ' ') ?? 'Not provided'],
                ['Date of birth', profile.dateOfBirth ?? 'Not provided'],
                ['Professional title', profile.professionalTitle ?? 'Not provided'],
                ['Qualifications', profile.qualifications.join(', ') || 'Not provided'],
                ['Years of experience', profile.yearsOfExperience ?? 'Not provided'],
                ['Registration', profile.registrationNumber ?? 'Not provided'],
                ['Specializations', profile.specializations.join(', ') || 'Not provided'],
                ['Procedures', profile.procedures.join(', ') || 'Not provided'],
                ['Working days', profile.workingHours.filter((hour) => hour.isOpen).length],
                ['Documents', `${profile.documents.length} uploaded`],
                ['Status', profile.onboardingStatus.replaceAll('_', ' ')],
              ]} />
              <div className="flex justify-start px-[18px] pt-3.5"><Button type="button" variant="secondary" onClick={() => setStep(3)}>Back to documents</Button></div>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
