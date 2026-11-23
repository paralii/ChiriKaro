import { Fragment } from 'react';
import { Button } from '@components/atoms/Button';
import type { DoctorProfile } from '@shared/types';

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
      <div className="grid grid-cols-1 px-4 py-3 sm:grid-cols-[minmax(140px,0.45fr)_minmax(0,1fr)] sm:px-5">
        {rows.map(([k, v]) => (
          <Fragment key={k}>
            <span className="border-b border-border py-2 text-sm font-medium text-text-muted sm:py-3">{k}</span>
            <strong className="min-w-0 border-b border-border py-2 text-sm font-medium wrap-break-word text-text-primary sm:py-3">{v}</strong>
          </Fragment>
        ))}
      </div>
      <div className="flex justify-end px-4 pt-4 sm:px-5"><Button disabled={busy || locked} onClick={onSubmit}>{busy ? 'Submitting...' : 'Submit for review'}</Button></div>
    </>
  );
}
