import { TextButton } from '@/components/atoms/TextLink';
import { DetailList } from '@/components/molecules/DetailList';
import { DocumentList } from '@/components/molecules/DocumentList';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import type { DoctorDetail } from '@/types';

export function DoctorReviewDetail({ profile, onClose, onOpenDocument }: { profile: DoctorDetail; onClose: () => void; onOpenDocument: (type: string) => void }) {
  return (
    <section className="mt-4 border-t border-[#ececf1]">
      <SectionHeading as="h3" title={`${profile.firstName} ${profile.lastName}`}
        description={`${profile.professionalTitle ?? 'Professional title not provided'} · ${profile.qualification ?? 'Qualification not provided'}`}
        action={<TextButton onClick={onClose}>Close</TextButton>} />
      <DetailList items={[
        ['Phone', profile.phone], ['Experience', profile.yearsOfExperience], ['Registration', profile.registrationNumber],
        ['Authority', profile.registrationAuthority], ['Specializations', profile.specializations.join(', ') || null],
        ['Procedures', profile.procedures.join(', ') || null],
        ['Working hours', profile.workingHours.filter((h) => h.isOpen).map((h) => `${h.day} ${h.startTime}-${h.endTime}`).join(', ') || null],
        ['About', profile.bio],
      ]} />
      <div className="pb-2.5"><DocumentList openLabel="Open" onOpen={onOpenDocument} items={profile.documents.map((d) => ({ key: d.documentType, label: d.documentType, status: d.status }))} /></div>
    </section>
  );
}