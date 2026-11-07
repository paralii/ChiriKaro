import { TextButton } from '@components/atoms/TextLink';
import { DetailList } from '@components/molecules/DetailList';
import { DocumentList } from '@components/molecules/DocumentList';
import { SectionHeading } from '@components/molecules/SectionHeading';
import type { DoctorOnboardingProfile } from '@shared/types';

export function DoctorReviewDetail({ profile, onClose, onOpenDocument }: {
  profile: DoctorOnboardingProfile;
  onClose: () => void;
  onOpenDocument: (type: string) => void;
}) {
  return (
    <section className="mt-4 border-t border-[#ececf1]">
      <SectionHeading as="h3" title={`${profile.firstName} ${profile.lastName}`}
        description={profile.professionalTitle ?? 'Professional title not provided'}
        action={<TextButton onClick={onClose}>Close</TextButton>} />
      <DetailList items={[
        ['Gender', profile.gender?.replaceAll('_', ' ') ?? null],
        ['Date of birth', profile.dateOfBirth?.slice(0, 10) ?? null],
        ['Qualifications', profile.qualifications.join(', ') || null],
        ['Experience', profile.yearsOfExperience],
        ['Registration', profile.registrationNumber],
        ['Authority', profile.registrationAuthority],
        ['Specializations', profile.specializations.join(', ') || null],
        ['Procedures', profile.procedures.join(', ') || null],
        ['Working hours', profile.workingHours.filter((hour) => hour.isOpen).map((hour) => `${hour.day} ${hour.startTime}-${hour.endTime}`).join(', ') || null],
        ['Verification status', profile.onboardingStatus.replaceAll('_', ' ')],
      ]} />
      <div className="pb-2.5"><DocumentList openLabel="Open" onOpen={onOpenDocument} items={profile.documents.map((document) => ({ key: document.documentType, label: document.documentType.replaceAll('_', ' '), status: document.status }))} /></div>
    </section>
  );
}
