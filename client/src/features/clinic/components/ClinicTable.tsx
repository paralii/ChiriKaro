import { useState } from 'react';
import { Badge } from '@components/atoms/Badge';
import { statusTone } from '@shared/utils/statusTones';
import { Button } from '@components/atoms/Button';
import { EmptyState } from '@/components/molecules/EmptyState';
import { CellTitle, DataTable, tdClass } from '@components/molecules/DataTable';
import type { Clinic, ClinicStatus } from '@shared/types';

export function ClinicTable({ clinics, onStatus, onDetails, busy }: { clinics: Clinic[]; onStatus: (id: string, status: ClinicStatus, reason?: string) => void; onDetails?: (id: string) => void; busy: boolean }) {
  const [rejectingClinic, setRejectingClinic] = useState<Clinic | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!clinics.length) return <EmptyState>No clinics to show yet.</EmptyState>;
  return (
    <>
    <DataTable headers={['CLINIC', 'OWNER', 'STATUS', 'CONTACT', 'ACTIONS']}>
      {clinics.map((c) => (
        <tr key={c.id}>
          <td className={tdClass}><CellTitle title={c.name} lines={[c.address ?? 'Address not provided']} /></td>
          <td className={tdClass}>{c.ownerName ?? '—'}</td>
          <td className={tdClass}><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
          <td className={tdClass}>{c.contactEmail ?? '—'}</td>
          <td className={tdClass}>
            <div className="flex items-center gap-[5px] whitespace-nowrap">
              {c.status === 'PENDING' && c.setupStatus === 'PENDING_VERIFICATION' ? (
                <>
                  <Button size="xs" variant="ghost" disabled={busy} onClick={() => onStatus(c.id, 'APPROVED')}>Approve</Button>
                  <Button size="xs" variant="ghost" disabled={busy} onClick={() => { setRejectingClinic(c); setRejectionReason(''); }}>Reject</Button>
                </>
              ) : c.status === 'PENDING' ? (
                <span className="text-[9px] text-[#777c8a]">Awaiting clinic submission</span>
              ) : c.status === 'APPROVED' ? (
                <Button size="xs" variant="ghost" disabled={busy} onClick={() => { if (window.confirm(`Block ${c.name}?`)) onStatus(c.id, 'BLOCKED'); }}>Block</Button>
              ) : c.status === 'REJECTED' ? (
                <span className="text-[9px] text-[#777c8a]">Awaiting clinic resubmission</span>
              ) : (
                <Button size="xs" variant="ghost" disabled={busy} onClick={() => { if (window.confirm(`Unblock ${c.name}?`)) onStatus(c.id, 'APPROVED'); }}>Unblock</Button>
              )}
              {onDetails ? <Button size="xs" variant="ghost" disabled={busy} onClick={() => onDetails(c.id)}>Details</Button> : <details className="basis-full whitespace-normal">
                <summary className="w-fit cursor-pointer list-none rounded-[4px] border border-[#dce2f1] bg-white p-[6px_7px] text-[9px] font-semibold text-brand-deep hover:bg-brand-soft [&::-webkit-details-marker]:hidden">Details</summary>
                <div className="grid min-w-[195px] grid-cols-[85px_minmax(0,1fr)] gap-x-2.5 gap-y-[7px] rounded-[5px] border border-[#e6e8ef] bg-white p-2.5 shadow-[0_5px_18px_#242c4012]">
                  <span className="text-[9px] text-[#777c8a]">Phone</span><strong className="text-[9px] text-[#393d49]">{c.phone ?? 'Not provided'}</strong>
                  <span className="text-[9px] text-[#777c8a]">Account access</span><strong className="text-[9px] text-[#393d49]">{c.isActive === undefined ? (c.status === 'APPROVED' ? 'Active' : 'Inactive') : c.isActive ? 'Active' : 'Inactive'}</strong>
                </div>
              </details>}
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
    {rejectingClinic ? (
      <div role="presentation" className="fixed inset-0 z-50 grid place-items-center bg-[#17203a66] p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setRejectingClinic(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="clinic-rejection-title" className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
          <h2 id="clinic-rejection-title" className="m-0 text-base font-semibold text-[#292d38]">Reject {rejectingClinic.name}</h2>
          <p className="mt-2 text-xs text-[#656a79]">Give the clinic a reason so they know what to correct before resubmitting.</p>
          <label htmlFor="clinic-rejection-reason" className="mb-1 block text-xs font-medium text-[#393d49]">Rejection reason</label>
          <textarea id="clinic-rejection-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={1000} required rows={4} className="w-full rounded border border-[#dce2f1] p-2 text-sm" />
          <div className="mt-3 flex justify-end gap-2">
            <Button size="xs" variant="ghost" disabled={busy} onClick={() => setRejectingClinic(null)}>Cancel</Button>
            <Button size="xs" disabled={busy || !rejectionReason.trim() || rejectionReason.trim().length > 1000} onClick={() => { onStatus(rejectingClinic.id, 'REJECTED', rejectionReason.trim()); setRejectingClinic(null); }}>Confirm rejection</Button>
          </div>
        </section>
      </div>
    ) : null}
    </>
  );
}
