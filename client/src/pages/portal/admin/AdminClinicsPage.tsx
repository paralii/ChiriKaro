import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicTable } from '@/features/clinic/components/ClinicTable';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Form } from '@/components/atoms/Form';
import { useAdminClinics } from '@/features/admin/hooks/useAdminClinics';
import { useAppDispatch } from '@/store/hooks';
import { loadAdminClinics } from '@/features/admin/store/adminClinicsSlice';
import { superAdminService } from '@/features/admin/services/superAdminService';
import { useAction } from '@/shared/hooks/useAction';
import type { Clinic } from '@/shared/types';
import { openSignedUrl } from '@/services/storageService';
import { ListPagination } from '@/components/molecules/ListPagination';

export default function AdminClinicsPage({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const dispatch = useAppDispatch();
  const { items, busy, error, message, changeStatus, page, totalItems, totalPages } = useAdminClinics();
  const [requestedPage, setRequestedPage] = useState(1);
  const [searchDraft, setSearchDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('');
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const { busy: detailBusy, error: detailError, run } = useAction();
  useEffect(() => { void dispatch(loadAdminClinics({ page: requestedPage, search: appliedSearch, status: pendingOnly ? 'PENDING' : appliedStatus })); }, [dispatch, requestedPage, appliedSearch, appliedStatus, pendingOnly]);
  const list = items;
  const applyFilters = (event: React.FormEvent) => { event.preventDefault(); setRequestedPage(1); setAppliedSearch(searchDraft.trim()); setAppliedStatus(statusDraft); };
  const resetFilters = () => { setSearchDraft(''); setStatusDraft(''); setRequestedPage(1); setAppliedSearch(''); setAppliedStatus(''); };
  const showDetails = (id: string) => void run(async () => setSelectedClinic(await superAdminService.getClinic(id)), { fallback: 'Could not load clinic details.' });
  const reviewDocuments = Array.isArray(selectedClinic?.documents)
    ? selectedClinic.documents.filter((doc) => doc && typeof doc.documentType === 'string' && doc.documentType.trim().length > 0)
    : [];
  const reviewHours = Array.isArray(selectedClinic?.workingHours)
    ? selectedClinic.workingHours.filter((hour) => hour && typeof hour.day === 'string')
    : [];
  const openDocument = (clinicId: string, documentType: string) => void run(async () => {
    const blobUrl = URL.createObjectURL(await superAdminService.getClinicDocument(clinicId, documentType));
    openSignedUrl(blobUrl);
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  }, { fallback: 'Could not open the clinic document.' });

  return (
    <>
      <Notices error={error} message={message} />
      <Card className="overflow-hidden">
        <SectionHeading title={pendingOnly ? 'Applications awaiting review' : 'Clinic directory'} description={`${totalItems} clinic${totalItems === 1 ? '' : 's'} found`} action={<Badge>PAGE {page}{totalPages ? ` OF ${totalPages}` : ''}</Badge>} />
        <Form onSubmit={applyFilters} className={`grid grid-cols-1 items-end gap-4 bg-page px-4 pb-4 sm:grid-cols-2 sm:rounded-lg sm:mx-4 sm:mb-4 sm:p-4 ${pendingOnly ? 'lg:grid-cols-[minmax(0,1fr)_auto]' : 'lg:grid-cols-[minmax(0,1fr)_220px_auto]'}`}>
          <label className="grid gap-2 text-sm font-medium text-text-secondary">Search clinics<Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} maxLength={100} placeholder="Name, email, address, city" /></label>
          {!pendingOnly ? <label className="grid gap-2 text-sm font-medium text-text-secondary">Status<Select value={statusDraft} onChange={(event) => setStatusDraft(event.target.value)}><option value="">All statuses</option>{['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'].map((status) => <option key={status} value={status}>{status}</option>)}</Select></label> : null}
          <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-1"><Button size="sm" disabled={busy}>Apply</Button><Button type="button" size="sm" variant="ghost" disabled={busy || (!searchDraft && !statusDraft && !appliedSearch && !appliedStatus)} onClick={resetFilters}>Reset</Button></div>
        </Form>
        <ClinicTable clinics={list} onStatus={changeStatus} onDetails={showDetails} busy={busy || detailBusy} />
        <ListPagination page={page} totalPages={totalPages} totalItems={totalItems} busy={busy} onPageChange={setRequestedPage} />
      </Card>
      {detailError ? <Notices error={detailError} /> : null}
      {selectedClinic ? (
        <div role="dialog" aria-modal="true" aria-label="Clinic registration details" className="fixed inset-0 z-50 grid place-items-center bg-text-primary/60 p-3 sm:p-4" onClick={() => setSelectedClinic(null)}>
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <Card className="overflow-hidden">
              <SectionHeading title={selectedClinic.name} description="Clinic registration details" action={<Button size="xs" variant="ghost" onClick={() => setSelectedClinic(null)}>Close</Button>} />
              <dl className="grid grid-cols-[minmax(6rem,0.45fr)_minmax(0,1fr)] gap-x-3 gap-y-3 px-4 py-4 text-sm leading-relaxed sm:gap-x-4 sm:px-5">
                <dt className="text-text-muted">Status</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedClinic.status}</dd>
                <dt className="text-text-muted">Setup review</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedClinic.setupStatus?.replaceAll('_', ' ') ?? 'Not submitted'}</dd>
                <dt className="text-text-muted">Clinic owner</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedClinic.ownerName ?? 'Not available'}</dd>
                <dt className="text-text-muted">Address</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedClinic.address ?? 'Not provided'}</dd>
                <dt className="text-text-muted">City / State</dt><dd className="m-0 wrap-break-word text-text-primary">{[selectedClinic.city, selectedClinic.state, selectedClinic.pincode].filter(Boolean).join(', ') || 'Not provided'}</dd>
                <dt className="text-text-muted">Specializations</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedClinic.specializations?.join(', ') || 'Not provided'}</dd>
                <dt className="text-text-muted">Working hours</dt><dd className="m-0 wrap-break-word text-text-primary">{reviewHours.length ? <ul className="m-0 grid list-none gap-1 p-0">{reviewHours.map((hour) => <li key={hour.day}>{hour.day}: {hour.isOpen ? `${hour.startTime || '—'}–${hour.endTime || '—'}` : 'Closed'}</li>)}</ul> : 'Not provided'}</dd>
                <dt className="text-text-muted">Doctors</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedClinic.doctors?.length ? <ul className="m-0 grid list-none gap-2 p-0">{selectedClinic.doctors.map((doctor, index) => <li key={`${doctor.name}-${index}`}><strong>{doctor.name}</strong>{doctor.professionalTitle ? ` · ${doctor.professionalTitle}` : ''} · {doctor.verificationStatus.replaceAll('_', ' ')}{doctor.specializations.length ? ` · ${doctor.specializations.join(', ')}` : ''}</li>)}</ul> : 'No doctors associated'}</dd>
                <dt className="text-text-muted">Clinic team</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedClinic.staff?.length ? <ul className="m-0 grid list-none gap-2 p-0">{selectedClinic.staff.map((member, index) => <li key={`${member.name}-${member.role}-${index}`}><strong>{member.name}</strong> · {member.role.replaceAll('_', ' ')} · {member.status.toLowerCase()}</li>)}</ul> : 'No clinic admin or staff accounts found'}</dd>
                <dt className="text-text-muted">Documents</dt><dd className="m-0 wrap-break-word text-text-primary">{reviewDocuments.length ? <ul className="m-0 grid list-none gap-2 p-0">{reviewDocuments.map((doc) => <li key={doc.documentType} className="flex flex-wrap items-center justify-between gap-2"><span>{doc.documentType.replaceAll('_', ' ')} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Date unavailable'}</span><Button size="xs" variant="ghost" disabled={detailBusy} onClick={() => openDocument(selectedClinic.id, doc.documentType)}>Review file</Button></li>)}</ul> : 'No valid documents submitted'}</dd>
                <dt className="text-text-muted">Review history</dt><dd className="m-0 wrap-break-word text-text-primary">{selectedClinic.reviewHistory?.length ? <ul className="m-0 grid list-none gap-1 p-0">{selectedClinic.reviewHistory.map((entry, index) => <li key={`${entry.reviewedAt}-${index}`}>{entry.decision} · {new Date(entry.reviewedAt).toLocaleString()}{entry.reason ? ` · ${entry.reason}` : ''}</li>)}</ul> : 'No review decisions recorded'}</dd>
              </dl>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
