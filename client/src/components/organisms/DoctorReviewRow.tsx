import { useState } from 'react';
import { Badge, statusTone } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { CellTitle, tdClass } from '@/components/molecules/DataTable';
import type { DoctorSummary } from '@/types';

const smallInput = 'h-[31px] w-[95px] min-w-0 rounded-[4px] border border-[#cfd2df] px-[7px] text-[10px]';

export function DoctorReviewRow({ doctor, busy, onInspect, onApprove, onReject, onSaveFee, onError }: {
  doctor: DoctorSummary; busy: boolean;
  onInspect: () => void; onApprove: () => void; onReject: (reason: string) => void; onSaveFee: (fee: number) => void; onError: (m: string) => void;
}) {
  const [fee, setFee] = useState(doctor.consultationFee?.toString() ?? '');
  const [reason, setReason] = useState('');

  const saveFee = () => {
    const value = Number(fee);
    if (!Number.isFinite(value) || value <= 0) return onError('Consultation fee must be greater than zero.');
    onSaveFee(value);
  };
  const reject = () => {
    if (reason.trim().length < 5) return onError('Add a rejection reason of at least 5 characters.');
    onReject(reason.trim());
  };

  return (
    <tr>
      <td className={tdClass}><CellTitle title={doctor.name} lines={[doctor.email, doctor.specializations.join(', ') || 'Specialization not added']} /></td>
      <td className={tdClass}>{doctor.onboardingProgress}%</td>
      <td className={tdClass}><Badge tone={statusTone(doctor.verificationStatus)}>{doctor.verificationStatus.replaceAll('_', ' ')}</Badge></td>
      <td className={tdClass}>
        <div className="flex min-w-[150px] gap-[5px] max-md:min-w-[130px]">
          <input aria-label={`Consultation fee for ${doctor.name}`} type="number" min="1" step="0.01" className={smallInput} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="Set fee" />
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={saveFee}>Save</Button>
        </div>
      </td>
      <td className={tdClass}>
        <div className="flex items-center gap-[5px] whitespace-nowrap">
          <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onInspect}>Review profile</Button>
          {doctor.verificationStatus === 'PENDING_VERIFICATION' ? (
            <>
              <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={onApprove}>Approve</Button>
              <label className="grid gap-1 text-[9px] whitespace-normal text-[#777b89]">Rejection reason
                <input className={smallInput} value={reason} onChange={(e) => setReason(e.target.value)} minLength={5} placeholder="What needs correction?" />
              </label>
              <Button type="button" size="xs" variant="ghost" disabled={busy} onClick={reject}>Request changes</Button>
            </>
          ) : null}
        </div>
      </td>
    </tr>
  );
}