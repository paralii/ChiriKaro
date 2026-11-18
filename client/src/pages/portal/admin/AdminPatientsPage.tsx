import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Form } from '@/components/atoms/Form';
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
  const [searchDraft, setSearchDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<SuperAdminPatient | null>(null);
  const { busy, error, message, run } = useAction();

  const load = useCallback(() => run(async () => {
    const result = await superAdminService.listPatients(page, 20, search, status);
    setPatients(result.items);
    setPage(result.page);
    setTotalItems(result.totalItems);
    setTotalPages(result.totalPages);
  }, { fallback: 'Could not load patients.' }), [page, run, search, status]);

  useEffect(() => { void load(); }, [load]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(searchDraft.trim());
    setStatus(statusDraft);
    setPage(1);
  };

  const setPatientStatus = (patient: SuperAdminPatient) => {
    const blocking = patient.status === 'ACTIVE';
    const action = blocking ? 'Block' : 'Unblock';
    if (!window.confirm(`${action} patient ${patient.name}?`)) return;
    void run(async () => {
      const updated = await superAdminService.updatePatientStatus(patient.id, blocking ? 'SUSPENDED' : 'ACTIVE');
      const leavesCurrentFilter = status && status !== updated.status;
      setPatients((current) => leavesCurrentFilter
        ? current.filter((item) => item.id !== updated.id)
        : current.map((item) => item.id === updated.id ? { ...item, ...updated } : item));
      if (leavesCurrentFilter) {
        const nextCount = Math.max(0, totalItems - 1);
        setTotalItems(nextCount);
        setTotalPages(Math.ceil(nextCount / 20));
      }
      setSelectedPatient((current) => current?.id === updated.id ? { ...current, ...updated } : current);
    }, { success: `Patient ${blocking ? 'blocked' : 'unblocked'}.`, fallback: `Could not ${action.toLowerCase()} patient.` });
  };

  const showDetails = (id: string) => void run(async () => setSelectedPatient(await superAdminService.getPatient(id)), { fallback: 'Could not load patient details.' });

  return <>
    <Notices error={error} message={message} />
    <Card>
      <SectionHeading title="Patient directory" description={`${totalItems} patient${totalItems === 1 ? '' : 's'} found`} action={<Badge>PAGE {page}{totalPages ? ` OF ${totalPages}` : ''}</Badge>} />
      <Form onSubmit={applyFilters} className="grid grid-cols-[minmax(180px,1fr)_180px_auto] items-end gap-2 px-[15px] pb-3 max-md:grid-cols-1">
        <label className="grid gap-1 text-[10px] text-[#777c8a]">Search patients<Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} maxLength={100} placeholder="Name or email" /></label>
        <label className="grid gap-1 text-[10px] text-[#777c8a]">Status<select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)} className="h-[38px] rounded border border-[#cfd2df] bg-white px-2 text-xs"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="SUSPENDED">Blocked</option></select></label>
        <Button size="xs" disabled={busy}>Apply</Button>
      </Form>
      {busy && !patients.length ? <div className="p-4 text-xs text-[#777c8a]">Loading patients...</div> : !patients.length ? <EmptyState>No patients match these filters.</EmptyState> : (
        <DataTable headers={['PATIENT', 'EMAIL', 'STATUS', 'REGISTERED', 'ACTIONS']}>
          {patients.map((patient) => <tr key={patient.id}>
            <td className={tdClass}><CellTitle title={patient.name} /></td>
            <td className={tdClass}>{patient.email}</td>
            <td className={tdClass}><Badge tone={patient.status === 'ACTIVE' ? 'approved' : 'blocked'}>{patient.status === 'ACTIVE' ? 'ACTIVE' : 'BLOCKED'}</Badge></td>
            <td className={tdClass}>{new Date(patient.createdAt).toLocaleDateString()}</td>
            <td className={tdClass}><div className="flex gap-1"><Button size="xs" variant="ghost" disabled={busy} onClick={() => showDetails(patient.id)}>Details</Button><Button size="xs" variant="ghost" disabled={busy} onClick={() => setPatientStatus(patient)}>{patient.status === 'ACTIVE' ? 'Block' : 'Unblock'}</Button></div></td>
          </tr>)}
        </DataTable>
      )}
      {totalPages > 1 ? <div className="flex items-center justify-end gap-2 border-t border-[#eff0f4] px-[15px] py-3">
        <Button size="xs" variant="ghost" disabled={busy || page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <span className="text-[10px] text-[#656a79]">Page {page} of {totalPages}</span>
        <Button size="xs" variant="ghost" disabled={busy || page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div> : null}
    </Card>
    {selectedPatient ? <div role="dialog" aria-modal="true" aria-label="Patient details" className="fixed inset-0 z-50 grid place-items-center bg-[#17203a66] p-4" onClick={() => setSelectedPatient(null)}>
      <div className="w-full max-w-xl" onClick={(event) => event.stopPropagation()}><Card>
        <SectionHeading title={selectedPatient.name} description="Patient account details" action={<Button size="xs" variant="ghost" onClick={() => setSelectedPatient(null)}>Close</Button>} />
        <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-4 gap-y-3 px-[18px] py-4 text-xs">
          <dt className="text-[#777c8a]">Email</dt><dd className="m-0">{selectedPatient.email}</dd>
          <dt className="text-[#777c8a]">Status</dt><dd className="m-0">{selectedPatient.status === 'ACTIVE' ? 'Active' : 'Blocked'}</dd>
          <dt className="text-[#777c8a]">Registered</dt><dd className="m-0">{new Date(selectedPatient.createdAt).toLocaleString()}</dd>
          <dt className="text-[#777c8a]">Last updated</dt><dd className="m-0">{selectedPatient.updatedAt ? new Date(selectedPatient.updatedAt).toLocaleString() : '—'}</dd>
        </dl>
        <div className="flex justify-end border-t border-[#eff0f4] p-3"><Button size="xs" variant="ghost" onClick={() => setPatientStatus(selectedPatient)}>{selectedPatient.status === 'ACTIVE' ? 'Block patient' : 'Unblock patient'}</Button></div>
      </Card></div>
    </div> : null}
  </>;
}
