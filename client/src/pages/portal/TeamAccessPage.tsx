import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Card } from '@/components/atoms/Card';
import { DetailList } from '@/components/molecules/DetailList';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { roleDashboardService } from '@/features/dashboard/services/roleDashboardService';
import { doctorService } from '@/features/doctor/services/doctorService';
import { useAction } from '@/shared/hooks/useAction';
import { roleLabels } from '@/shared/constants/roles';
import type { DoctorConsultationFee, DoctorFeeChangeRequest, RoleDashboard } from '@/shared/types';
import { useAppSelector } from '@/store/hooks';

export default function TeamAccessPage() {
  const user = useAppSelector((state) => state.auth.user)!;
  const [dashboard, setDashboard] = useState<RoleDashboard | null>(null);
  const { busy, error, run } = useAction();
  const [consultationFee, setConsultationFee] = useState<DoctorConsultationFee | null>(null);
  const [feeRequests, setFeeRequests] = useState<DoctorFeeChangeRequest[]>([]);
  const [requestedFee, setRequestedFee] = useState('');
  const [feeReason, setFeeReason] = useState('');
  const { busy: feeBusy, error: feeError, message: feeMessage, run: loadFee } = useAction();

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
      setRequestedFee(result.consultationFee?.toString() ?? '');
      setFeeRequests(await doctorService.listFeeChangeRequests());
      return result;
    }, { fallback: 'Could not load the consultation fee.' });
  }, [loadFee, user.role]);

  const clinic = dashboard?.clinic;
  const submitFeeRequest = () => {
    const fee = Number(requestedFee);
    if (!requestedFee.trim() || !Number.isFinite(fee) || fee < 0 || Math.abs(fee * 100 - Math.round(fee * 100)) > 1e-8) return;
    void loadFee(async () => {
      const request = await doctorService.requestFeeChange(fee, feeReason.trim() || undefined);
      setFeeRequests((current) => [request, ...current]);
      setFeeReason('');
      return request;
    }, { success: 'Fee change request sent to your Clinic Admin.', fallback: 'Could not submit fee change request.' });
  };
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
      {feeMessage ? <Notices message={feeMessage} /> : null}
      <Card>
        <SectionHeading title="Workspace details" description={busy ? 'Loading your clinic association...' : 'Information associated with your account'} />
        <DetailList items={details} />
      </Card>
      {user.role === 'DOCTOR' ? <Card className="mt-[18px] pb-5">
        <SectionHeading title="Consultation fee" description="The active fee is managed by your Clinic Admin. Request a change for their review." />
        <div className="grid gap-3 px-[18px] pt-4 md:grid-cols-[180px_1fr_auto] md:items-end">
          <label className="grid gap-1 text-xs text-[#656a79]">Requested fee
            <input type="number" min="0" step="0.01" value={requestedFee} disabled={feeBusy || feeRequests.some((request) => request.status === 'PENDING')} onChange={(event) => setRequestedFee(event.target.value)} className="h-9 rounded border border-[#cfd2df] px-2" />
          </label>
          <label className="grid gap-1 text-xs text-[#656a79]">Reason (optional)
            <input value={feeReason} maxLength={1000} disabled={feeBusy || feeRequests.some((request) => request.status === 'PENDING')} onChange={(event) => setFeeReason(event.target.value)} className="h-9 rounded border border-[#cfd2df] px-2" />
          </label>
          <Button type="button" disabled={feeBusy || feeRequests.some((request) => request.status === 'PENDING') || !requestedFee.trim() || !Number.isFinite(Number(requestedFee)) || Number(requestedFee) < 0 || Math.abs(Number(requestedFee) * 100 - Math.round(Number(requestedFee) * 100)) > 1e-8} onClick={submitFeeRequest}>Submit request</Button>
        </div>
        <div className="grid gap-2 px-[18px] pt-5">
          <h3 className="m-0 text-xs font-semibold text-[#393d49]">Request history</h3>
          {feeRequests.length ? feeRequests.map((request) => <div key={request.requestId} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#ececf1] p-3 text-xs">
            <span>{request.currentFeeAtRequest == null ? 'No active fee' : request.currentFeeAtRequest.toFixed(2)} → {request.requestedFee.toFixed(2)} · {new Date(request.requestedAt).toLocaleDateString()}{request.reason ? ` · ${request.reason}` : ''}{request.reviewReason ? ` · Review note: ${request.reviewReason}` : ''}</span>
            <Badge tone={request.status === 'APPROVED' ? 'approved' : request.status === 'REJECTED' ? 'rejected' : 'pending'}>{request.status}</Badge>
          </div>) : <p className="m-0 text-xs text-[#777c8a]">No fee change requests yet.</p>}
        </div>
      </Card> : null}
    </>
  );
}
