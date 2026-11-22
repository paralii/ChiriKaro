import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Form } from '@/components/atoms/Form';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { DataTable, CellTitle, tdClass } from '@/components/molecules/DataTable';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { superAdminService } from '@/features/admin/services/superAdminService';
import { useAction } from '@/shared/hooks/useAction';
import type { SuperAdminDoctor, SuperAdminDoctorDetail } from '@/shared/types';
import { ListPagination } from '@/components/molecules/ListPagination';

const statuses = ['NOT_STARTED', 'IN_PROGRESS', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'];

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<SuperAdminDoctor[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchDraft, setSearchDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<SuperAdminDoctorDetail | null>(null);
  const { busy, error, run } = useAction();

  const load = useCallback(() => run(async () => {
    const result = await superAdminService.listDoctors(page, 20, search, status);
    setDoctors(result.items);
    setPage(result.page);
    setTotalItems(result.totalItems);
    setTotalPages(result.totalPages);
  }, { fallback: 'Could not load doctors.' }), [page, run, search, status]);
  useEffect(() => { void load(); }, [load]);

  const applyFilters = (event: React.FormEvent) => {
    event.preventDefault();
    setSearch(searchDraft.trim());
    setStatus(statusDraft);
    setPage(1);
  };
  const resetFilters = () => { setSearchDraft(''); setStatusDraft(''); setSearch(''); setStatus(''); setPage(1); };
  const showDetails = (id: string) => void run(async () => setSelectedDoctor(await superAdminService.getDoctor(id)), { fallback: 'Could not load doctor details.' });

  return <>
    <Notices error={error} />
    <Card className="overflow-hidden">
      <SectionHeading title="Doctor directory" description={`${totalItems} doctor${totalItems === 1 ? '' : 's'} found`} action={<Badge>PAGE {page}{totalPages ? ` OF ${totalPages}` : ''}</Badge>} />
      <Form onSubmit={applyFilters} className="grid grid-cols-1 items-end gap-4 bg-page px-4 pb-4 sm:mx-4 sm:mb-4 sm:grid-cols-2 sm:rounded-lg sm:p-4 lg:grid-cols-[minmax(0,1fr)_240px_auto]">
        <label className="grid gap-2 text-sm font-medium text-text-secondary">Search doctors<Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} maxLength={100} placeholder="Name, email, clinic, specialty" /></label>
        <label className="grid gap-2 text-sm font-medium text-text-secondary">Verification status<Select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</Select></label>
        <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1"><Button size="sm" disabled={busy}>Apply</Button><Button type="button" size="sm" variant="ghost" disabled={busy || (!searchDraft && !statusDraft && !search && !status)} onClick={resetFilters}>Reset</Button></div>
      </Form>
      {busy && !doctors.length ? <div className="p-4 text-sm text-text-muted sm:px-5">Loading doctors...</div> : !doctors.length ? <EmptyState>No doctors match these filters.</EmptyState> : <DataTable headers={['DOCTOR', 'EMAIL', 'CLINIC', 'SPECIALTIES', 'STATUS', 'ACTIONS']}>
        {doctors.map((doctor) => <tr key={doctor.id}>
          <td className={tdClass}><CellTitle title={doctor.name} lines={doctor.professionalTitle ? [doctor.professionalTitle] : []} /></td>
          <td className={tdClass}>{doctor.email ?? '—'}</td>
          <td className={tdClass}>{doctor.clinicName ?? '—'}</td>
          <td className={tdClass}>{doctor.specializations.length ? doctor.specializations.join(', ') : '—'}</td>
          <td className={tdClass}><Badge tone={doctor.verificationStatus === 'VERIFIED' ? 'approved' : doctor.verificationStatus === 'REJECTED' ? 'rejected' : 'pending'}>{doctor.verificationStatus.replaceAll('_', ' ')}</Badge></td>
          <td className={tdClass}><Button size="xs" variant="ghost" disabled={busy} onClick={() => showDetails(doctor.id)}>Details</Button></td>
        </tr>)}
      </DataTable>}
      <ListPagination page={page} totalPages={totalPages} totalItems={totalItems} busy={busy} onPageChange={setPage} />
    </Card>
    {selectedDoctor ? <div role="dialog" aria-modal="true" aria-label="Doctor details" className="fixed inset-0 z-50 grid place-items-center bg-text-primary/60 p-3 sm:p-4" onClick={() => setSelectedDoctor(null)}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto" onClick={(event) => event.stopPropagation()}><Card className="overflow-hidden">
        <SectionHeading title={selectedDoctor.name} description="Doctor profile details" action={<Button size="xs" variant="ghost" onClick={() => setSelectedDoctor(null)}>Close</Button>} />
        <dl className="grid grid-cols-[minmax(7rem,0.45fr)_minmax(0,1fr)] gap-x-3 gap-y-3 px-4 py-4 text-sm leading-relaxed sm:gap-x-4 sm:px-5">
          <dt className="text-text-muted">Email</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.email ?? '—'}</dd>
          <dt className="text-text-muted">Clinic</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.clinicName ?? 'Not associated'}</dd>
          <dt className="text-text-muted">Professional title</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.professionalTitle ?? '—'}</dd>
          <dt className="text-text-muted">Verification</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.verificationStatus.replaceAll('_', ' ')}</dd>
          <dt className="text-text-muted">Specializations</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.specializations.join(', ') || '—'}</dd>
          <dt className="text-text-muted">Procedures</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.procedures.join(', ') || '—'}</dd>
          <dt className="text-text-muted">Qualifications</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.qualifications.join(', ') || '—'}</dd>
          <dt className="text-text-muted">Experience</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.yearsOfExperience == null ? '—' : `${selectedDoctor.yearsOfExperience} years`}</dd>
          <dt className="text-text-muted">Registration</dt><dd className="m-0 wrap-break-word text-text-primary">{[selectedDoctor.registrationNumber, selectedDoctor.registrationAuthority].filter(Boolean).join(' · ') || '—'}</dd>
          <dt className="text-text-muted">Consultation fee</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.consultationFee == null ? '—' : `₹${selectedDoctor.consultationFee}`}</dd>
          <dt className="text-text-muted">Working hours</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.workingHours.length ? <ul className="m-0 grid list-none gap-1 p-0">{selectedDoctor.workingHours.map((hour) => <li key={hour.day}>{hour.day}: {hour.isOpen ? `${hour.startTime}–${hour.endTime}` : 'Closed'}</li>)}</ul> : '—'}</dd>
          <dt className="text-text-muted">Documents</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.documents.length ? <ul className="m-0 grid list-none gap-1 p-0">{selectedDoctor.documents.map((doc, index) => <li key={`${doc.documentType}-${index}`}>{doc.documentType.replaceAll('_', ' ')} · {doc.status.replaceAll('_', ' ')}{doc.rejectionReason ? ` · ${doc.rejectionReason}` : ''}</li>)}</ul> : '—'}</dd>
          {selectedDoctor.rejectionReason ? <><dt className="text-text-muted">Rejection reason</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedDoctor.rejectionReason}</dd></> : null}
          <dt className="text-text-muted">Registered</dt><dd className="m-0 wrap-break-word text-text-primary">{new Date(selectedDoctor.createdAt).toLocaleDateString()}</dd>
        </dl>
      </Card></div>
    </div> : null}
  </>;
}
