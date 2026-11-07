import { useState } from 'react';
import { Badge } from '@components/atoms/Badge';
import { statusTone } from '@shared/utils/statusTones';
import { Button } from '@components/atoms/Button';
import { CellTitle, tdClass } from '@components/molecules/DataTable';
import type { DoctorVerificationSummary } from '@shared/types';

const smallInput = 'h-[31px] w-[150px] min-w-0 rounded-[4px] border border-[#cfd2df] px-[7px] text-[10px]';

export function DoctorReviewRow({ doctor, busy, onInspect, onApprove, onReject, onError }: {
  doctor: DoctorVerificationSummary;
  busy: boolean;
  onInspect: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onError: (message: string) => void;
}) {
  const [reason, setReason] = useState('');
  const name = `${doctor.firstName} ${doctor.lastName}`.trim();
  const updatedAt = new Date(doctor.updatedAt);
  const dateLabel = Number.isNaN(updatedAt.getTime()) ? '—' : updatedAt.toLocaleDateString();
  const reject = () => {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length > 1000) return onError('Enter a rejection reason between 1 and 1000 characters.');
    onReject(trimmed);
  };

  return (
    <tr>
      <td className={tdClass}><CellTitle title={name} lines={[doctor.professionalTitle ?? 'Professional title not provided']} /></td>
      <td className={tdClass}><Badge tone={statusTone(doctor.verificationStatus)}>{doctor.verificationStatus.replaceAll('_', ' ')}</Badge></td>
      <td className={tdClass}>{dateLabel}</td>
      <td className={tdClass}>
        <div className="flex flex-wrap items-center gap-[5px]">
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onInspect}>Review profile</Button>
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onApprove}>Approve</Button>
          <label className="grid gap-1 text-[9px] text-[#777b89]">Reason for changes
            <input aria-label={`Reason for rejecting ${name}`} className={smallInput} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="What needs correction?" />
          </label>
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={reject}>Request changes</Button>
        </div>
      </td>
    </tr>
  );
}
