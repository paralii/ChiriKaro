import { Fragment } from 'react';
import { Button } from '@/components/atoms/Button';
import type { DoctorProfile } from '@/types';

export function DoctorReviewStep({ profile, busy, onSubmit }: { profile: DoctorProfile; busy: boolean; onSubmit: () => void }) {
  const rows: [string, string | number][] = [
    ['Professional details', profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : 'Incomplete'],
    ['Documents', `${profile.documents.length} uploaded`],
    ['Specializations', profile.specializations.join(', ') || 'Incomplete'],
    ['Working days', profile.workingHours.filter((h) => h.isOpen).length],
    ['Consultation fee', profile.consultationFee == null ? 'Not set by clinic' : profile.consultationFee],
  ];
  const locked = profile.verificationStatus === 'PENDING_VERIFICATION' || profile.verificationStatus === 'VERIFIED';
  return (
    <>
      <div className="grid grid-cols-[minmax(120px,0.45fr)_1fr] px-[18px] py-[9px]">
        {rows.map(([k, v]) => (
          <Fragment key={k}>
            <span className="border-b border-[#f0f0f4] py-2.5 text-[11px] text-[#7e8290]">{k}</span>
            <strong className="border-b border-[#f0f0f4] py-2.5 text-[11px] font-medium break-words text-[#333744]">{v}</strong>
          </Fragment>
        ))}
      </div>
      <div className="flex justify-end px-[18px] pt-3.5"><Button disabled={busy || locked} onClick={onSubmit}>{busy ? 'Submitting...' : 'Submit for review'}</Button></div>
    </>
  );
}