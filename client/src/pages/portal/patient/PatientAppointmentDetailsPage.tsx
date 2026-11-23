import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Notice } from '@/components/atoms/Notice';
import { DetailList } from '@/components/molecules/DetailList';
import { PageHeading } from '@/components/molecules/PageHeading';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { PatientAppointmentStatusBadge } from '@/features/patient/components/PatientAppointmentStatusBadge';
import { PatientPaymentSummary } from '@/features/patient/components/PatientPaymentSummary';
import { appointmentService, type AppointmentPaymentStatus } from '@/features/patient/services/appointmentService';
import { getErrorMessage } from '@/shared/lib/http';
import type { PatientAppointment } from '@/shared/types';

export default function PatientAppointmentDetailsPage() {
  const { appointmentId = '' } = useParams();
  const [appointment, setAppointment] = useState<PatientAppointment | null>(null);
  const [loadedId, setLoadedId] = useState('');
  const [error, setError] = useState<{ id: string; message: string; missing: boolean } | null>(null);
  const [payment, setPayment] = useState<AppointmentPaymentStatus | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const loading = loadedId !== appointmentId;
  const currentError = error?.id === appointmentId ? error : null;

  const refreshPayment = useCallback(async (id: string) => {
    setPaymentLoading(true);
    setPaymentError('');
    try { setPayment(await appointmentService.getPaymentStatus(id)); }
    catch (reason) { setPaymentError(getErrorMessage(reason, 'Could not load payment status.')); }
    finally { setPaymentLoading(false); }
  }, []);

  useEffect(() => {
    let active = true;
    void appointmentService.get(appointmentId).then((result) => {
      if (active) {
        setAppointment(result);
        setError(null);
        void refreshPayment(appointmentId);
      }
    }).catch((reason: unknown) => {
      if (!active) return;
      setError({ id: appointmentId, missing: axios.isAxiosError(reason) && reason.response?.status === 404, message: getErrorMessage(reason, 'Could not load appointment details.') });
    }).finally(() => { if (active) setLoadedId(appointmentId); });
    return () => { active = false; };
  }, [appointmentId, refreshPayment]);

  const backToManagement = `/patient/appointments?appointmentId=${encodeURIComponent(appointmentId)}`;

  return <>
    <div className="mb-5"><Link to="/patient/appointments" className="text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">← Back to appointments</Link></div>
    <PageHeading eyebrow="APPOINTMENT DETAILS" title={loading ? 'Loading appointment…' : appointment ? `Appointment ${appointment.appointmentId.slice(-8).toUpperCase()}` : 'Appointment details'} />
    {loading ? <Card className="p-5"><div aria-busy="true" className="grid gap-3"><div className="h-5 w-1/2 animate-pulse rounded bg-page" /><div className="h-24 animate-pulse rounded bg-page" /><span className="sr-only">Loading appointment details</span></div></Card> : null}
    {!loading && currentError ? <Card className="p-4 sm:p-5"><Notice tone={currentError.missing ? 'warning' : 'error'}>{currentError.missing ? 'This appointment could not be found.' : currentError.message}</Notice><Link to="/patient/appointments"><Button variant="secondary">Return to appointments</Button></Link></Card> : null}
    {!loading && !currentError && appointment ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
      <Card className="mt-0 overflow-hidden"><SectionHeading title="Appointment summary" description="Details returned for your appointment." />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-5"><span className="text-xs text-text-muted">Reference · {appointment.appointmentId}</span><PatientAppointmentStatusBadge appointment={appointment} /></div>
        <DetailList items={[
          ['Clinic', appointment.clinicName],
          ['Doctor', appointment.doctorName],
          ['Date', appointment.localDate],
          ['Time', `${appointment.localStartTime}–${appointment.localEndTime} (${appointment.timeZone})`],
          ['Consultation fee', new Intl.NumberFormat('en-IN', { style: 'currency', currency: appointment.feeCurrency }).format(appointment.feeAmountMinor / 100)],
          ['Appointment status', appointment.status.replaceAll('_', ' ')],
          ['Booking created', new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(appointment.createdAt))],
          ...(appointment.status === 'PENDING_PAYMENT' ? [['Payment hold expires', new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(appointment.holdExpiresAt))] as [string, string]] : []),
        ]} />
        {appointment.changeHistory.length ? <div className="border-t border-border px-4 py-4 sm:px-5"><h2 className="m-0 text-sm font-semibold text-text-primary">Change history</h2><ol className="mb-0 mt-3 grid gap-3 pl-5 text-sm text-text-secondary">{appointment.changeHistory.map((change, index) => <li key={`${change.type}-${change.changedAt}-${index}`}>{change.type === 'CANCELLED' ? 'Cancelled' : 'Rescheduled'} · previous time {change.previousLocalDate}, {change.previousLocalStartTime}–{change.previousLocalEndTime} · {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(change.changedAt))}</li>)}</ol></div> : null}
      </Card>
      <Card className="mt-0 overflow-hidden"><SectionHeading title="Payment status" description="Payment status is supplied by the appointment payment service." />
        <div className="p-4 sm:p-5">{paymentLoading ? <p role="status" className="m-0 text-sm text-text-muted">Loading payment status…</p> : null}
          {paymentError ? <Notice tone="error" className="mb-3">{paymentError}</Notice> : null}
          {payment ? <PatientPaymentSummary appointment={appointment} payment={payment} compact /> : null}
          <Button type="button" size="sm" variant="secondary" disabled={paymentLoading} onClick={() => void refreshPayment(appointmentId)}>{paymentLoading ? 'Refreshing…' : 'Refresh payment status'}</Button>
          <p className="mb-0 mt-3 text-xs leading-relaxed text-text-muted">A pending appointment hold is not confirmation. Successful payment and confirmed appointment status must both be returned by the server.</p>
        </div>
      </Card>
      <Card className="mt-0 p-4 sm:p-5 lg:col-span-2"><h2 className="m-0 text-base font-semibold text-text-primary">Manage appointment</h2><p className="mb-3 mt-1 text-sm text-text-secondary">Cancellation, rescheduling, and pending payment actions remain subject to server policy.</p><div className="flex flex-wrap gap-2">{appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired ? <Link to={backToManagement}><Button size="sm">Continue to payment</Button></Link> : null}<Link to={backToManagement}><Button size="sm" variant="secondary">Open appointment actions</Button></Link></div></Card>
    </div> : null}
  </>;
}
