import { useState } from 'react';
import { Badge } from '@components/atoms/Badge';
import { statusTone } from '@shared/utils/statusTones';
import { Button } from '@components/atoms/Button';
import { CellTitle, tdClass } from '@components/molecules/DataTable';
import type { DoctorVerificationSummary } from '@shared/types';

const reviewInput = 'h-10 w-full min-w-0 rounded-md border border-border-strong bg-surface-elevated px-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:bg-surface';

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
        {doctor.consultationFee == null ? <div className="flex min-w-50 flex-wrap items-center gap-2">
          <input aria-label={`Initial consultation fee for ${name}`} type="number" min="0" step="0.01" className={reviewInput} value={fee} onChange={(event) => setFee(event.target.value)} placeholder="Set initial fee" />
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={saveFee}>Set</Button>
        </div> : <span>{doctor.consultationFee.toFixed(2)} <small className="mt-1 block text-sm text-text-muted">Changes require request approval</small></span>}
      </td>
      <td className={tdClass}>{dateLabel}</td>
      <td className={tdClass}>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onInspect}>Review profile</Button>
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onApprove}>Approve</Button>
          <label className="grid min-w-45 gap-1.5 text-xs font-medium text-text-secondary">Reason for changes
            <input aria-label={`Reason for rejecting ${name}`} className={reviewInput} value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} placeholder="What needs correction?" />
          </label>
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={reject}>Request changes</Button>
        </div>
      </td>
    </tr>
  );
}
