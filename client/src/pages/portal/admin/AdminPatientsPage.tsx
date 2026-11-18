import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Card } from '@/components/atoms/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { DataTable, CellTitle, tdClass } from '@/components/molecules/DataTable';
import { superAdminService } from '@/features/admin/services/superAdminService';
import { useAction } from '@/shared/hooks/useAction';
import type { SuperAdminPatient } from '@/shared/types';

export default function AdminPatientsPage() {
  const [patients, setPatients] = useState<SuperAdminPatient[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const { busy, error, message, run } = useAction();

  const load = useCallback(() => run(async () => {
    const result = await superAdminService.listPatients(page);
    setPatients(result.items);
    setPage(result.page);
    setTotalItems(result.totalItems);
    setTotalPages(result.totalPages);
  }, { fallback: 'Could not load patients.' }), [page, run]);

  useEffect(() => { void load(); }, [load]);

  const setPatientStatus = (patient: SuperAdminPatient) => {
    const blocking = patient.status === 'ACTIVE';
    const action = blocking ? 'Block' : 'Unblock';
    if (!window.confirm(`${action} patient ${patient.name}?`)) return;
    void run(async () => {
      const updated = await superAdminService.updatePatientStatus(patient.id, blocking ? 'SUSPENDED' : 'ACTIVE');
      setPatients((current) => current.map((item) => item.id === updated.id ? updated : item));
    }, { success: `Patient ${blocking ? 'blocked' : 'unblocked'}.`, fallback: `Could not ${action.toLowerCase()} patient.` });
  };

  return <>
    <Notices error={error} message={message} />
    <Card>
      <SectionHeading title="Patient directory" description={`${totalItems} patient${totalItems === 1 ? '' : 's'} found`} action={<Badge>PAGE {page}{totalPages ? ` OF ${totalPages}` : ''}</Badge>} />
      {busy && !patients.length ? <div className="p-4 text-xs text-[#777c8a]">Loading patients...</div> : !patients.length ? <EmptyState>No patients to show yet.</EmptyState> : (
        <DataTable headers={['PATIENT', 'EMAIL', 'STATUS', 'REGISTERED', 'ACTIONS']}>
          {patients.map((patient) => <tr key={patient.id}>
            <td className={tdClass}><CellTitle title={patient.name} /></td>
            <td className={tdClass}>{patient.email}</td>
            <td className={tdClass}><Badge tone={patient.status === 'ACTIVE' ? 'approved' : 'blocked'}>{patient.status === 'ACTIVE' ? 'ACTIVE' : 'BLOCKED'}</Badge></td>
            <td className={tdClass}>{new Date(patient.createdAt).toLocaleDateString()}</td>
            <td className={tdClass}><Button size="xs" variant="ghost" disabled={busy} onClick={() => setPatientStatus(patient)}>{patient.status === 'ACTIVE' ? 'Block' : 'Unblock'}</Button></td>
          </tr>)}
        </DataTable>
      )}
      {totalPages > 1 ? <div className="flex items-center justify-end gap-2 border-t border-[#eff0f4] px-[15px] py-3">
        <Button size="xs" variant="ghost" disabled={busy || page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <span className="text-[10px] text-[#656a79]">Page {page} of {totalPages}</span>
        <Button size="xs" variant="ghost" disabled={busy || page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div> : null}
    </Card>
  </>;
}
