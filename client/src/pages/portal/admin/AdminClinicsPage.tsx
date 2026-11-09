import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicTable } from '@/features/clinic/components/ClinicTable';
import { useAdminClinics } from '@/features/admin/hooks/useAdminClinics';
import { useAppDispatch } from '@/store/hooks';
import { loadAdminClinics } from '@/features/admin/store/adminClinicsSlice';
import { superAdminService } from '@/features/admin/services/superAdminService';
import { useAction } from '@/shared/hooks/useAction';
import type { Clinic } from '@/shared/types';
import { openSignedUrl } from '@/services/storageService';

export default function AdminClinicsPage({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const dispatch = useAppDispatch();
  const { items, busy, error, message, changeStatus, page, totalItems, totalPages } = useAdminClinics();
  const [requestedPage, setRequestedPage] = useState(1);
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
  const { busy: detailBusy, error: detailError, run } = useAction();
  useEffect(() => { void dispatch(loadAdminClinics(requestedPage)); }, [dispatch, requestedPage]);
  const list = pendingOnly ? items.filter((c) => c.status === 'PENDING') : items;
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
      <Card>
        <SectionHeading title={pendingOnly ? 'Applications awaiting review' : 'Clinic directory'} description={`${pendingOnly ? list.length : totalItems} clinic${(pendingOnly ? list.length : totalItems) === 1 ? '' : 's'} found`} action={<Badge>PAGE {page}{totalPages ? ` OF ${totalPages}` : ''}</Badge>} />
        <ClinicTable clinics={list} onStatus={changeStatus} onDetails={showDetails} busy={busy || detailBusy} />
        {totalPages > 1 ? (
          <div className="flex items-center justify-end gap-2 border-t border-[#eff0f4] px-[15px] py-3">
            <Button size="xs" variant="ghost" disabled={busy || page <= 1} onClick={() => setRequestedPage(page - 1)}>Previous</Button>
            <span className="text-[10px] text-[#656a79]">Page {page} of {totalPages}</span>
            <Button size="xs" variant="ghost" disabled={busy || page >= totalPages} onClick={() => setRequestedPage(page + 1)}>Next</Button>
          </div>
        ) : null}
      </Card>
      {detailError ? <Notices error={detailError} /> : null}
      {selectedClinic ? (
        <div role="dialog" aria-modal="true" aria-label="Clinic registration details" className="fixed inset-0 z-50 grid place-items-center bg-[#17203a66] p-4" onClick={() => setSelectedClinic(null)}>
          <div className="w-full max-w-xl" onClick={(event) => event.stopPropagation()}>
            <Card>
              <SectionHeading title={selectedClinic.name} description="Clinic registration details" action={<Button size="xs" variant="ghost" onClick={() => setSelectedClinic(null)}>Close</Button>} />
              <dl className="grid grid-cols-[130px_minmax(0,1fr)] gap-x-4 gap-y-3 px-[18px] py-4 text-xs">
                <dt className="text-[#777c8a]">Status</dt><dd className="m-0">{selectedClinic.status}</dd>
                <dt className="text-[#777c8a]">Setup review</dt><dd className="m-0">{selectedClinic.setupStatus?.replaceAll('_', ' ') ?? 'Not submitted'}</dd>
                <dt className="text-[#777c8a]">Clinic ID</dt><dd className="m-0 break-all">{selectedClinic.id}</dd>
                <dt className="text-[#777c8a]">Admin ID</dt><dd className="m-0 break-all">{selectedClinic.ownerAdminId ?? '—'}</dd>
                <dt className="text-[#777c8a]">Address</dt><dd className="m-0">{selectedClinic.address ?? 'Not provided'}</dd>
                <dt className="text-[#777c8a]">City / State</dt><dd className="m-0">{[selectedClinic.city, selectedClinic.state, selectedClinic.pincode].filter(Boolean).join(', ') || 'Not provided'}</dd>
                {/* <dt className="text-[#777c8a]">Phone</dt><dd className="m-0">{selectedClinic.phone ?? 'Not provided'}</dd> */}
                {/* <dt className="text-[#777c8a]">Contact email</dt><dd className="m-0">{selectedClinic.contactEmail ?? 'Not provided'}</dd> */}
                {/* <dt className="text-[#777c8a]">Registration no.</dt><dd className="m-0">{selectedClinic.registrationNumber ?? 'Not provided'}</dd> */}
                <dt className="text-[#777c8a]">Specializations</dt><dd className="m-0">{selectedClinic.specializations?.join(', ') || 'Not provided'}</dd>
                <dt className="text-[#777c8a]">Working hours</dt><dd className="m-0">{reviewHours.filter((hour) => hour.isOpen).map((hour) => `${hour.day}: ${hour.startTime || '—'}–${hour.endTime || '—'}`).join('; ') || 'Not provided'}</dd>
                <dt className="text-[#777c8a]">Documents</dt><dd className="m-0">{reviewDocuments.length ? <ul className="m-0 grid list-none gap-2 p-0">{reviewDocuments.map((doc) => <li key={doc.documentType} className="flex flex-wrap items-center justify-between gap-2"><span>{doc.documentType.replaceAll('_', ' ')} · {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Date unavailable'}</span><Button size="xs" variant="ghost" disabled={detailBusy} onClick={() => openDocument(selectedClinic.id, doc.documentType)}>Review file</Button></li>)}</ul> : 'No valid documents submitted'}</dd>
                <dt className="text-[#777c8a]">Registered</dt><dd className="m-0">{selectedClinic.createdAt ? new Date(selectedClinic.createdAt).toLocaleDateString() : '—'}</dd>
              </dl>
            </Card>
          </div>
        </div>
      ) : null}
    </>
  );
}
