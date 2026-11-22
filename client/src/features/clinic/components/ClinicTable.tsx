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
            <div className="flex items-center gap-1.25 whitespace-nowrap">
              {c.status === 'PENDING' && c.setupStatus === 'PENDING_VERIFICATION' ? (
                <>
                  <Button size="xs" variant="ghost" disabled={busy} onClick={() => onStatus(c.id, 'APPROVED')}>Approve</Button>
                  <Button size="xs" variant="ghost" disabled={busy} onClick={() => { setRejectingClinic(c); setRejectionReason(''); }}>Reject</Button>
                </>
              ) : c.status === 'PENDING' ? (
                <span className="text-xs text-text-muted">Awaiting clinic submission</span>
              ) : c.status === 'APPROVED' ? (
                <Button size="xs" variant="ghost" disabled={busy} onClick={() => { if (window.confirm(`Block ${c.name}?`)) onStatus(c.id, 'BLOCKED'); }}>Block</Button>
              ) : c.status === 'REJECTED' ? (
                <span className="text-xs text-text-muted">Awaiting clinic resubmission</span>
              ) : (
                <Button size="xs" variant="ghost" disabled={busy} onClick={() => { if (window.confirm(`Unblock ${c.name}?`)) onStatus(c.id, 'APPROVED'); }}>Unblock</Button>
              )}
              {onDetails ? <Button size="xs" variant="ghost" disabled={busy} onClick={() => onDetails(c.id)}>Details</Button> : <details className="basis-full whitespace-normal">
                <summary className="w-fit cursor-pointer list-none rounded-md border border-border bg-surface-elevated px-3 py-2 text-xs font-semibold text-primary-hover transition-colors duration-interactive hover:border-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus [&::-webkit-details-marker]:hidden">Details</summary>
                <div className="mt-2 grid min-w-55 grid-cols-[minmax(90px,auto)_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-md border border-border bg-surface-elevated p-3 shadow-md">
                  <span className="text-xs text-text-muted">Phone</span><strong className="wrap-break-word text-sm font-medium text-text-primary">{c.phone ?? 'Not provided'}</strong>
                  <span className="text-xs text-text-muted">Account access</span><strong className="text-sm font-medium text-text-primary">{c.isActive === undefined ? (c.status === 'APPROVED' ? 'Active' : 'Inactive') : c.isActive ? 'Active' : 'Inactive'}</strong>
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
          <h2 id="clinic-rejection-title" className="m-0 text-base font-semibold text-text-primary">Reject {rejectingClinic.name}</h2>
          <p className="mt-2 text-sm text-text-secondary">Give the clinic a reason so they know what to correct before resubmitting.</p>
          <label htmlFor="clinic-rejection-reason" className="mb-1 block text-sm font-medium text-text-primary">Rejection reason</label>
          <textarea id="clinic-rejection-reason" value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} maxLength={1000} required rows={4} className="w-full rounded-md border border-border-strong bg-surface-elevated p-3 text-sm text-text-primary placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />
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
