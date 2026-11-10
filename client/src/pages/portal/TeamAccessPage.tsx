import { useEffect, useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { DetailList } from '@/components/molecules/DetailList';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { roleDashboardService } from '@/features/dashboard/services/roleDashboardService';
import { doctorService } from '@/features/doctor/services/doctorService';
import { useAction } from '@/shared/hooks/useAction';
import { roleLabels } from '@/shared/constants/roles';
import type { DoctorConsultationFee, RoleDashboard } from '@/shared/types';
import { useAppSelector } from '@/store/hooks';

export default function TeamAccessPage() {
  const user = useAppSelector((state) => state.auth.user)!;
  const [dashboard, setDashboard] = useState<RoleDashboard | null>(null);
  const { busy, error, run } = useAction();
  const [consultationFee, setConsultationFee] = useState<DoctorConsultationFee | null>(null);
  const { busy: feeBusy, error: feeError, run: loadFee } = useAction();

  useEffect(() => {
    const role = user.role === 'DOCTOR' ? 'DOCTOR' : 'STAFF';
    void run(async () => {
      const result = await roleDashboardService.getDashboard(role);
      setDashboard(result);
      return result;
    }, { fallback: 'Could not load your workspace.' });
  }, [run, user.role]);

  useEffect(() => {
    if (user.role !== 'DOCTOR') return;
    void loadFee(async () => {
      const result = await doctorService.getConsultationFee();
      setConsultationFee(result);
      return result;
    }, { fallback: 'Could not load the consultation fee.' });
  }, [loadFee, user.role]);

  const clinic = dashboard?.clinic;
  const details: [string, string | number | null | undefined][] = [
    ['Name', dashboard?.user.name ?? user.name],
    ['Email', user.email],
    ['Role', roleLabels[user.role]],
    ['Clinic', clinic?.name ?? (busy ? 'Loading...' : 'Not linked')],
    ['Clinic status', clinic?.status ?? '—'],
  ];
  if (user.role === 'DOCTOR') {
    const fee = consultationFee?.consultationFee;
    details.push(['Consultation fee', feeBusy ? 'Loading...' : feeError ? 'Unavailable' : fee == null ? 'Not set by Clinic Admin' : fee.toFixed(2)]);
  }

  return (
    <>
      <Notices error={error} />
      {feeError ? <Notices error={feeError} /> : null}
      <Card>
        <SectionHeading title="Workspace details" description={busy ? 'Loading your clinic association...' : 'Information associated with your account'} />
        <DetailList items={details} />
      </Card>
    </>
  );
}
