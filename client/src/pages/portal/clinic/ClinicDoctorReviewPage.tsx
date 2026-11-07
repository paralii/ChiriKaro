import { useCallback, useEffect, useState } from 'react';
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

export default function ClinicDoctorReviewPage() {
  const [doctors, setDoctors] = useState<DoctorVerificationSummary[]>([]);
  const [selected, setSelected] = useState<{ id: string; profile: DoctorOnboardingProfile } | null>(null);
  const { busy, error, message, setError, run } = useAction();

  const refresh = useCallback(async () => {
    setDoctors(await clinicService.listPendingDoctorVerifications());
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
      {selected ? (
        <DoctorReviewDetail profile={selected.profile} onClose={() => setSelected(null)}
          onOpenDocument={(type) => openDocument(selected.id, type)} />
      ) : null}
    </Card>
  );
}
