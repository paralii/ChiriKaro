import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { DataTable } from '@/components/molecules/DataTable';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { DoctorReviewRow } from '@/features/doctor/components/DoctorReviewRow';
import { DoctorReviewDetail } from '@/features/doctor/components/DoctorReviewDetail';
import { useAction } from '@/shared/hooks/useAction';
import { clinicService } from '@/features/clinic/services/clinicService';
import { openSignedUrl } from '@/services/storageService';
import type { DoctorOnboardingProfile, DoctorVerificationSummary } from '@/shared/types';
import type { DoctorFeeChangeRequest } from '@/shared/types';

export default function ClinicDoctorReviewPage() {
  const [doctors, setDoctors] = useState<DoctorVerificationSummary[]>([]);
  const [feeRequests, setFeeRequests] = useState<DoctorFeeChangeRequest[]>([]);
  const [selected, setSelected] = useState<{ id: string; profile: DoctorOnboardingProfile } | null>(null);
  const { busy, error, message, setError, run } = useAction();

  const refresh = useCallback(async () => {
    const [pendingDoctors, requests] = await Promise.all([
      clinicService.listPendingDoctorVerifications(),
      clinicService.listDoctorFeeChangeRequests(),
    ]);
    setDoctors(pendingDoctors);
    setFeeRequests(requests);
  }, []);

  useEffect(() => { void run(refresh, { fallback: 'Could not load pending doctor verifications.' }); }, [run, refresh]);

  const act = (fn: () => Promise<unknown>, success: string) => void run(async () => {
    await fn();
    setSelected(null);
    await refresh();
  }, { success, fallback: 'The doctor verification update could not be saved.' });

  const saveFee = (doctorId: string, name: string, fee: number) => void run(async () => {
    const result = await clinicService.setDoctorFee(doctorId, fee);
    setDoctors((current) => current.map((doctor) => doctor.doctorId === doctorId ? { ...doctor, consultationFee: result.consultationFee } : doctor));
  }, { success: `Consultation fee saved for ${name}.`, fallback: 'Could not save the consultation fee.' });

  const reviewFeeRequest = (request: DoctorFeeChangeRequest, decision: 'APPROVED' | 'REJECTED', reason?: string) => void run(async () => {
    await clinicService.reviewDoctorFeeChangeRequest(request.doctorId, request.requestId, decision, reason);
    await refresh();
  }, { success: `Fee change request ${decision.toLowerCase()}.`, fallback: 'Could not review the fee change request.' });

  const openDocument = (doctorId: string, type: string) => void run(async () => {
    const content = await clinicService.getDoctorVerificationDocument(doctorId, type);
    const url = URL.createObjectURL(content);
    openSignedUrl(url);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }, { fallback: 'Could not open this doctor document.' });

  return (
    <Card>
      <SectionHeading title="Doctor verification" description="Review submitted profiles and either approve them or request corrections." />
      <div className="px-[18px] pt-4"><Notices error={error} message={message} /></div>
      {busy && !doctors.length ? <div className="px-[18px] py-5 text-sm text-[#777c8a]">Loading pending doctor verifications...</div> : !doctors.length ? <EmptyState>No doctor profiles are awaiting verification.</EmptyState> : (
        <DataTable headers={['DOCTOR', 'STATUS', 'CONSULTATION FEE', 'UPDATED', 'ACTIONS']}>
          {doctors.map((doctor) => {
            const name = `${doctor.firstName} ${doctor.lastName}`.trim();
            return (
              <DoctorReviewRow key={doctor.doctorId} doctor={doctor} busy={busy} onError={setError}
                onInspect={() => void run(async () => {
                  const result = await clinicService.getDoctorVerification(doctor.doctorId);
                  if (!result.profile) throw new Error('Doctor verification profile was not returned.');
                  setSelected({ id: doctor.doctorId, profile: result.profile });
                }, { fallback: 'Could not load this doctor profile.' })}
                onApprove={() => act(() => clinicService.approveDoctorVerification(doctor.doctorId), `${name}'s profile was approved.`)}
                onReject={(reason) => act(() => clinicService.rejectDoctorVerification(doctor.doctorId, reason), `Corrections were requested from ${name}.`)}
                onSaveFee={(fee) => saveFee(doctor.doctorId, name, fee)} />
            );
          })}
        </DataTable>
      )}
      <section className="border-t border-[#eff0f4] px-[18px] py-5">
        <SectionHeading title="Consultation fee requests" description="Review requests from doctors in your clinic. The active fee changes only when you approve a request." />
        {feeRequests.length ? <div className="grid gap-2 pt-4">{feeRequests.map((request) => <div key={request.requestId} className="flex flex-wrap items-center justify-between gap-3 rounded border border-[#ececf1] p-3">
          <div className="min-w-[220px] flex-1 text-xs text-[#555a69]">
            <strong className="text-[#292d38]">{request.doctorName ?? 'Doctor'}</strong>
            <p className="mb-0 mt-1">Current at request: {request.currentFeeAtRequest == null ? 'Not set' : request.currentFeeAtRequest.toFixed(2)} · Requested: {request.requestedFee.toFixed(2)}</p>
            {request.reason ? <p className="mb-0 mt-1">Reason: {request.reason}</p> : null}
            <p className="mb-0 mt-1 text-[#777c8a]">Submitted {new Date(request.requestedAt).toLocaleString()}</p>
          </div>
          <div className="flex gap-2">
            <Button size="xs" disabled={busy} onClick={() => reviewFeeRequest(request, 'APPROVED')}>Approve</Button>
            <Button size="xs" variant="ghost" disabled={busy} onClick={() => { const note = window.prompt(`Optional note for ${request.doctorName ?? 'this doctor'}?`); if (note !== null) reviewFeeRequest(request, 'REJECTED', note.trim() || undefined); }}>Reject</Button>
          </div>
        </div>)}</div> : <EmptyState>No consultation fee requests are awaiting review.</EmptyState>}
      </section>
      {selected ? (
        <DoctorReviewDetail profile={selected.profile} onClose={() => setSelected(null)}
          onOpenDocument={(type) => openDocument(selected.id, type)} />
      ) : null}
    </Card>
  );
}
