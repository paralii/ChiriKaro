import { Badge } from '@components/atoms/Badge';
import { statusTone } from '@shared/utils/statusTones';
import { Button } from '@components/atoms/Button';
import { EmptyState } from '@/components/molecules/EmptyState';
import { CellTitle, DataTable, tdClass } from '@components/molecules/DataTable';
import type { Clinic, ClinicStatus } from '@shared/types';

export function ClinicTable({ clinics, onStatus, onDetails, busy }: { clinics: Clinic[]; onStatus: (id: string, status: ClinicStatus) => void; onDetails?: (id: string) => void; busy: boolean }) {
  if (!clinics.length) return <EmptyState>No clinics to show yet.</EmptyState>;
  return (
    <DataTable headers={['CLINIC', 'OWNER / ADMIN ID', 'STATUS', 'CONTACT', 'ACTIONS']}>
      {clinics.map((c) => (
        <tr key={c.id}>
          <td className={tdClass}><CellTitle title={c.name} lines={[c.address ?? 'Address not provided']} /></td>
          <td className={tdClass}>{c.ownerName ?? c.ownerAdminId ?? '—'}</td>
          <td className={tdClass}><Badge tone={statusTone(c.status)}>{c.status}</Badge></td>
          <td className={tdClass}>{c.contactEmail ?? '—'}</td>
          <td className={tdClass}>
            <div className="flex items-center gap-[5px] whitespace-nowrap">
              {c.status === 'PENDING' && c.setupStatus === 'PENDING_VERIFICATION' ? (
                <>
                  <Button size="xs" variant="ghost" disabled={busy} onClick={() => onStatus(c.id, 'APPROVED')}>Approve</Button>
                  <Button size="xs" variant="ghost" disabled={busy} onClick={() => onStatus(c.id, 'REJECTED')}>Reject</Button>
                </>
              ) : c.status === 'PENDING' ? (
                <span className="text-[9px] text-[#777c8a]">Awaiting clinic submission</span>
              ) : c.status === 'APPROVED' ? (
                <Button size="xs" variant="ghost" disabled={busy} onClick={() => onStatus(c.id, 'BLOCKED')}>Block</Button>
              ) : c.status === 'REJECTED' ? (
                <Button size="xs" variant="ghost" disabled={busy} onClick={() => onStatus(c.id, 'PENDING')}>Reopen review</Button>
              ) : (
                <Button size="xs" variant="ghost" disabled={busy} onClick={() => onStatus(c.id, 'APPROVED')}>Unblock</Button>
              )}
              {onDetails ? <Button size="xs" variant="ghost" disabled={busy} onClick={() => onDetails(c.id)}>Details</Button> : <details className="basis-full whitespace-normal">
                <summary className="w-fit cursor-pointer list-none rounded-[4px] border border-[#dce2f1] bg-white p-[6px_7px] text-[9px] font-semibold text-brand-deep hover:bg-brand-soft [&::-webkit-details-marker]:hidden">Details</summary>
                <div className="grid min-w-[195px] grid-cols-[85px_minmax(0,1fr)] gap-x-2.5 gap-y-[7px] rounded-[5px] border border-[#e6e8ef] bg-white p-2.5 shadow-[0_5px_18px_#242c4012]">
                  <span className="text-[9px] text-[#777c8a]">Clinic ID</span><strong className="text-[9px] break-words text-[#393d49]">{c.id}</strong>
                  <span className="text-[9px] text-[#777c8a]">Phone</span><strong className="text-[9px] text-[#393d49]">{c.phone ?? 'Not provided'}</strong>
                  <span className="text-[9px] text-[#777c8a]">Account access</span><strong className="text-[9px] text-[#393d49]">{c.isActive === undefined ? (c.status === 'APPROVED' ? 'Active' : 'Inactive') : c.isActive ? 'Active' : 'Inactive'}</strong>
                </div>
              </details>}
            </div>
          </td>
        </tr>
      ))}
    </DataTable>
  );
}
