import { useState } from 'react';
import { Badge } from '@components/atoms/Badge';
import { statusTone } from '@shared/utils/statusTones';
import { Button } from '@components/atoms/Button';
import { CellTitle, tdClass } from '@components/molecules/DataTable';
import type { DoctorVerificationSummary } from '@shared/types';

const smallInput = 'h-[31px] w-[150px] min-w-0 rounded-[4px] border border-[#cfd2df] px-[7px] text-[10px]';

export function DoctorReviewRow({ doctor, busy, onInspect, onApprove, onReject, onSaveFee, onError }: {
  doctor: DoctorVerificationSummary;
  busy: boolean;
  onInspect: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onSaveFee: (fee: number) => void;
  onError: (message: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [fee, setFee] = useState(doctor.consultationFee?.toString() ?? '');
  const name = `${doctor.firstName} ${doctor.lastName}`.trim();
  const updatedAt = new Date(doctor.updatedAt);
  const dateLabel = Number.isNaN(updatedAt.getTime()) ? '—' : updatedAt.toLocaleDateString();
  const reject = () => {
    const trimmed = reason.trim();
    if (!trimmed || trimmed.length > 1000) return onError('Enter a rejection reason between 1 and 1000 characters.');
    onReject(trimmed);
  };
  const saveFee = () => {
    const value = Number(fee);
    if (!fee.trim() || !Number.isFinite(value) || value < 0 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-8) {
      return onError('Enter a non-negative consultation fee with up to two decimal places.');
    }
    onSaveFee(value);
  };

  return (
    <tr>
      <td className={tdClass}><CellTitle title={name} lines={[doctor.professionalTitle ?? 'Professional title not provided']} /></td>
      <td className={tdClass}><Badge tone={statusTone(doctor.verificationStatus)}>{doctor.verificationStatus.replaceAll('_', ' ')}</Badge></td>
      <td className={tdClass}>
        <div className="flex min-w-[180px] gap-[5px]">
          <input aria-label={`Consultation fee for ${name}`} type="number" min="0" step="0.01" className={smallInput} value={fee} onChange={(event) => setFee(event.target.value)} placeholder="Enter fee" />
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={saveFee}>Save</Button>
        </div>
      </td>
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
