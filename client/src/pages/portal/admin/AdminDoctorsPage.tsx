import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Form } from '@/components/atoms/Form';
import { Input } from '@/components/atoms/Input';
import { DataTable, CellTitle, tdClass } from '@/components/molecules/DataTable';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { superAdminService } from '@/features/admin/services/superAdminService';
import { useAction } from '@/shared/hooks/useAction';
import type { SuperAdminDoctor, SuperAdminDoctorDetail } from '@/shared/types';

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
  const showDetails = (id: string) => void run(async () => setSelectedDoctor(await superAdminService.getDoctor(id)), { fallback: 'Could not load doctor details.' });

  return <>
    <Notices error={error} />
    <Card>
      <SectionHeading title="Doctor directory" description={`${totalItems} doctor${totalItems === 1 ? '' : 's'} found`} action={<Badge>PAGE {page}{totalPages ? ` OF ${totalPages}` : ''}</Badge>} />
      <Form onSubmit={applyFilters} className="grid grid-cols-[minmax(180px,1fr)_220px_auto] items-end gap-2 px-[15px] pb-3 max-md:grid-cols-1">
        <label className="grid gap-1 text-[10px] text-[#777c8a]">Search doctors<Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} maxLength={100} placeholder="Name, email, clinic, specialty" /></label>
        <label className="grid gap-1 text-[10px] text-[#777c8a]">Verification status<select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)} className="h-[38px] rounded border border-[#cfd2df] bg-white px-2 text-xs"><option value="">All statuses</option>{statuses.map((item) => <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>)}</select></label>
        <Button size="xs" disabled={busy}>Apply</Button>
      </Form>
      {busy && !doctors.length ? <div className="p-4 text-xs text-[#777c8a]">Loading doctors...</div> : !doctors.length ? <EmptyState>No doctors match these filters.</EmptyState> : <DataTable headers={['DOCTOR', 'EMAIL', 'CLINIC', 'SPECIALTIES', 'STATUS', 'ACTIONS']}>
        {doctors.map((doctor) => <tr key={doctor.id}>
          <td className={tdClass}><CellTitle title={doctor.name} lines={doctor.professionalTitle ? [doctor.professionalTitle] : []} /></td>
          <td className={tdClass}>{doctor.email ?? '—'}</td>
          <td className={tdClass}>{doctor.clinicName ?? '—'}</td>
          <td className={tdClass}>{doctor.specializations.length ? doctor.specializations.join(', ') : '—'}</td>
          <td className={tdClass}><Badge tone={doctor.verificationStatus === 'VERIFIED' ? 'approved' : doctor.verificationStatus === 'REJECTED' ? 'rejected' : 'pending'}>{doctor.verificationStatus.replaceAll('_', ' ')}</Badge></td>
          <td className={tdClass}><Button size="xs" variant="ghost" disabled={busy} onClick={() => showDetails(doctor.id)}>Details</Button></td>
        </tr>)}
      </DataTable>}
      {totalPages > 1 ? <div className="flex items-center justify-end gap-2 border-t border-[#eff0f4] px-[15px] py-3">
        <Button size="xs" variant="ghost" disabled={busy || page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</Button>
        <span className="text-[10px] text-[#656a79]">Page {page} of {totalPages}</span>
        <Button size="xs" variant="ghost" disabled={busy || page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button>
      </div> : null}
    </Card>
    {selectedDoctor ? <div role="dialog" aria-modal="true" aria-label="Doctor details" className="fixed inset-0 z-50 grid place-items-center bg-[#17203a66] p-4" onClick={() => setSelectedDoctor(null)}>
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}><Card>
        <SectionHeading title={selectedDoctor.name} description="Doctor profile details" action={<Button size="xs" variant="ghost" onClick={() => setSelectedDoctor(null)}>Close</Button>} />
        <dl className="grid grid-cols-[150px_minmax(0,1fr)] gap-x-4 gap-y-3 px-[18px] py-4 text-xs">
          <dt className="text-[#777c8a]">Email</dt><dd className="m-0">{selectedDoctor.email ?? '—'}</dd>
          <dt className="text-[#777c8a]">Clinic</dt><dd className="m-0">{selectedDoctor.clinicName ?? 'Not associated'}</dd>
          <dt className="text-[#777c8a]">Professional title</dt><dd className="m-0">{selectedDoctor.professionalTitle ?? '—'}</dd>
          <dt className="text-[#777c8a]">Verification</dt><dd className="m-0">{selectedDoctor.verificationStatus.replaceAll('_', ' ')}</dd>
          <dt className="text-[#777c8a]">Specializations</dt><dd className="m-0">{selectedDoctor.specializations.join(', ') || '—'}</dd>
          <dt className="text-[#777c8a]">Procedures</dt><dd className="m-0">{selectedDoctor.procedures.join(', ') || '—'}</dd>
          <dt className="text-[#777c8a]">Qualifications</dt><dd className="m-0">{selectedDoctor.qualifications.join(', ') || '—'}</dd>
          <dt className="text-[#777c8a]">Experience</dt><dd className="m-0">{selectedDoctor.yearsOfExperience == null ? '—' : `${selectedDoctor.yearsOfExperience} years`}</dd>
          <dt className="text-[#777c8a]">Registration</dt><dd className="m-0">{[selectedDoctor.registrationNumber, selectedDoctor.registrationAuthority].filter(Boolean).join(' · ') || '—'}</dd>
          <dt className="text-[#777c8a]">Consultation fee</dt><dd className="m-0">{selectedDoctor.consultationFee == null ? '—' : `₹${selectedDoctor.consultationFee}`}</dd>
          <dt className="text-[#777c8a]">Working hours</dt><dd className="m-0">{selectedDoctor.workingHours.length ? <ul className="m-0 grid list-none gap-1 p-0">{selectedDoctor.workingHours.map((hour) => <li key={hour.day}>{hour.day}: {hour.isOpen ? `${hour.startTime}–${hour.endTime}` : 'Closed'}</li>)}</ul> : '—'}</dd>
          <dt className="text-[#777c8a]">Documents</dt><dd className="m-0">{selectedDoctor.documents.length ? <ul className="m-0 grid list-none gap-1 p-0">{selectedDoctor.documents.map((doc, index) => <li key={`${doc.documentType}-${index}`}>{doc.documentType.replaceAll('_', ' ')} · {doc.status.replaceAll('_', ' ')}{doc.rejectionReason ? ` · ${doc.rejectionReason}` : ''}</li>)}</ul> : '—'}</dd>
          {selectedDoctor.rejectionReason ? <><dt className="text-[#777c8a]">Rejection reason</dt><dd className="m-0">{selectedDoctor.rejectionReason}</dd></> : null}
          <dt className="text-[#777c8a]">Registered</dt><dd className="m-0">{new Date(selectedDoctor.createdAt).toLocaleDateString()}</dd>
        </dl>
      </Card></div>
    </div> : null}
  </>;
}
