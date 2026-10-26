import { useCallback, useEffect, useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { EmptyState } from '@/components/atoms/EmptyState';
import { DataTable } from '@/components/molecules/DataTable';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { DoctorReviewRow } from '@/components/organisms/DoctorReviewRow';
import { DoctorReviewDetail } from '@/components/organisms/DoctorReviewDetail';
import { useAction } from '@/hooks/useAction';
import { clinicService } from '@/services/clinicService';
import { openSignedUrl } from '@/services/storageService';
import type { DoctorDetail, DoctorSummary } from '@/types';

export default function ClinicDoctorReviewPage() {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [selected, setSelected] = useState<{ id: string; profile: DoctorDetail } | null>(null);
  const { busy, error, message, setError, run } = useAction();

  const refresh = useCallback(async () => setDoctors(await clinicService.listDoctors()), []);

  useEffect(() => { void run(refresh, { fallback: 'Could not load Doctors for review.' }); }, [run, refresh]);

  const act = (fn: () => Promise<unknown>, success: string) => void run(async () => { await fn(); await refresh(); }, { success, fallback: 'The Doctor update could not be saved.' });

  return (
    <Card>
      <SectionHeading title="Doctor review" description="Review submitted profiles and configure consultation fees." />
      <div className="px-[18px] pt-4"><Notices error={error} message={message} /></div>
      {!doctors.length ? <EmptyState>No invited Doctors have started onboarding yet.</EmptyState> : (
        <DataTable headers={['DOCTOR', 'ONBOARDING', 'REVIEW', 'CONSULTATION FEE', 'ACTIONS']}>
          {doctors.map((d) => (
            <DoctorReviewRow key={d.id} doctor={d} busy={busy} onError={setError}
              onInspect={() => void run(async () => setSelected({ id: d.id, profile: await clinicService.getDoctor(d.id) }), { fallback: 'Could not load this Doctor profile.' })}
              onApprove={() => act(() => clinicService.approveDoctor(d.id), `${d.name}'s profile was approved.`)}
              onReject={(reason) => act(() => clinicService.rejectDoctor(d.id, reason), `Changes requested from ${d.name}.`)}
              onSaveFee={(fee) => act(() => clinicService.setDoctorFee(d.id, fee), `Consultation fee saved for ${d.name}.`)} />
          ))}
        </DataTable>
      )}
      {selected ? (
        <DoctorReviewDetail profile={selected.profile} onClose={() => setSelected(null)}
          onOpenDocument={(type) => void run(async () => openSignedUrl((await clinicService.getDoctorDocumentUrl(selected.id, type)).url), { fallback: 'Could not open the document.' })} />
      ) : null}
    </Card>
  );
}