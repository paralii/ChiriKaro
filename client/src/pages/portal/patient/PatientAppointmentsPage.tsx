import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Dialog, DialogAction } from '@/components/atoms/Dialog';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { EmptyState } from '@/components/molecules/EmptyState';
import { ListPagination } from '@/components/molecules/ListPagination';
import { PatientAppointmentStatusBadge } from '@/features/patient/components/PatientAppointmentStatusBadge';
import { PatientPaymentSummary } from '@/features/patient/components/PatientPaymentSummary';
import { getPaymentPresentation } from '@/features/patient/components/paymentPresentation';
import { appointmentService, type AppointmentPaymentStatus } from '@/features/patient/services/appointmentService';
import { publicDirectoryService } from '@/features/patient/services/publicDirectoryService';
import { getErrorMessage } from '@/shared/lib/http';
import type { DatedAvailability, PatientAppointment } from '@/shared/types';
import { isRealDate } from '@/shared/utils/validators';

type RazorpayCheckoutOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  handler: (result: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
};
type PaymentDialogStage = 'summary' | 'processing' | 'pending' | 'success' | 'failure' | 'dismissed' | 'initialization-error';
declare global { interface Window { Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void }; } }

function loadRazorpay(): Promise<boolean> {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
    if (existing) {
      existing.addEventListener('load', () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener('error', () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve(Boolean(window.Razorpay));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PatientAppointmentsPage() {
  const [searchParams] = useSearchParams();
  const focusAppointmentId = searchParams.get('appointmentId') ?? '';
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentBusy, setPaymentBusy] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, AppointmentPaymentStatus>>({});
  const [paymentTarget, setPaymentTarget] = useState<PatientAppointment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentDialogStage, setPaymentDialogStage] = useState<PaymentDialogStage>('summary');
  const [paymentDialogError, setPaymentDialogError] = useState('');
  const [paymentOrderAmount, setPaymentOrderAmount] = useState<number | undefined>();
  const [reschedulingId, setReschedulingId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleAvailability, setRescheduleAvailability] = useState<DatedAvailability | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState('');
  const [changeBusy, setChangeBusy] = useState(false);
  const [cancellationTarget, setCancellationTarget] = useState<PatientAppointment | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled' | 'pending'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [rescheduleConfirmationOpen, setRescheduleConfirmationOpen] = useState(false);
  const pageSize = 8;

  const filteredAppointments = appointments.filter((appointment) => {
    if (activeFilter === 'upcoming') return appointment.status === 'CONFIRMED';
    if (activeFilter === 'completed') return appointment.status === 'COMPLETED';
    if (activeFilter === 'cancelled') return appointment.status === 'CANCELLED';
    if (activeFilter === 'pending') return appointment.status === 'PENDING_PAYMENT';
    return true;
  });
  const pageCount = Math.ceil(filteredAppointments.length / pageSize);
  const safePage = Math.min(currentPage, Math.max(pageCount, 1));
  const visibleAppointments = filteredAppointments.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    if (focusAppointmentId && !loading && activeFilter === 'all') {
      document.getElementById(`appointment-${focusAppointmentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusAppointmentId, loading, activeFilter, currentPage, visibleAppointments.length]);

  const loadRescheduleAvailability = async (appointment: PatientAppointment, date: string) => {
    setRescheduleDate(date);
    setRescheduleAvailability(null);
    setRescheduleTarget('');
    if (!isRealDate(date)) { setError('Choose a valid appointment date.'); return; }
    try {
      setRescheduleAvailability(await publicDirectoryService.availability(appointment.listingId, date));
    } catch (reason) { setError(getErrorMessage(reason, 'Could not load new appointment times.')); }
  };

  const cancelAppointment = async () => {
    if (!cancellationTarget || changeBusy) return;
    const appointment = cancellationTarget;
    setChangeBusy(true);
    setError('');
    try {
      const updated = await appointmentService.cancel(appointment.appointmentId);
      setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
      if (updated.cancellationRefundReviewStatus === 'PENDING_REVIEW') setPaymentMessage('Appointment cancelled. Your paid cancellation is pending manual refund review.');
      setReschedulingId('');
      setCancellationTarget(null);
    } catch (reason) { setError(getErrorMessage(reason, 'Could not cancel this appointment.')); }
    finally { setChangeBusy(false); }
  };

  const submitReschedule = async (appointment: PatientAppointment): Promise<boolean> => {
    if (!rescheduleTarget) return false;
    setChangeBusy(true);
    setError('');
    try {
      const updated = await appointmentService.reschedule(appointment.appointmentId, { listingId: appointment.listingId, date: rescheduleDate, startsAt: rescheduleTarget });
      setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
      setPaymentMessage('Appointment rescheduled. Its fee and payment status were preserved.');
      setReschedulingId('');
      setRescheduleAvailability(null);
      return true;
    } catch (reason) { setError(getErrorMessage(reason, 'Could not reschedule this appointment.')); return false; }
    finally { setChangeBusy(false); }
  };

  const refreshPaymentStatus = async (appointmentId: string) => {
    setPaymentBusy(appointmentId);
    try {
      const payment = await appointmentService.getPaymentStatus(appointmentId);
      const appointment = await appointmentService.get(appointmentId);
      setAppointments((current) => current.map((item) => item.appointmentId === appointmentId ? appointment : item));
      setPaymentStatuses((current) => ({ ...current, [appointmentId]: payment }));
      const presentation = getPaymentPresentation(appointment, payment);
      setPaymentTarget(appointment);
      setPaymentMessage(presentation.message);
      setPaymentDialogStage(presentation.confirmed ? 'success' : payment.paymentStatus === 'FAILED' ? 'failure' : 'pending');
      setPaymentDialogOpen(true);
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not refresh payment status.'));
      setPaymentDialogError(getErrorMessage(reason, 'Could not refresh payment status.'));
      setPaymentDialogStage('pending');
      setPaymentDialogOpen(true);
    } finally { setPaymentBusy(''); }
  };

  const applyPaymentResult = (appointment: PatientAppointment, payment: AppointmentPaymentStatus, stage: 'pending' | 'success' | 'failure' | 'dismissed') => {
    setPaymentTarget(appointment);
    setPaymentStatuses((current) => ({ ...current, [appointment.appointmentId]: payment }));
    const presentation = getPaymentPresentation(appointment, payment);
    setPaymentMessage(presentation.message);
    setPaymentDialogStage(presentation.confirmed ? 'success' : payment.paymentStatus === 'FAILED' ? 'failure' : stage);
    setPaymentDialogError('');
    setPaymentDialogOpen(true);
  };

  const payForAppointment = async (appointment: PatientAppointment) => {
    if (paymentBusy) return;
    setPaymentBusy(appointment.appointmentId);
    setPaymentMessage('');
    setError('');
    setPaymentDialogError('');
    setPaymentDialogStage('processing');
    try {
      const order = await appointmentService.createPaymentOrder(appointment.appointmentId);
      setPaymentOrderAmount(order.amountMinor);
      setPaymentStatuses((current) => ({ ...current, [appointment.appointmentId]: { appointmentId: appointment.appointmentId, paymentStatus: order.status, appointmentStatus: appointment.status } }));
      if (order.mode === 'MOCK') {
        const testResult = await appointmentService.confirmTestPayment(appointment.appointmentId);
        const testAppointment = { ...appointment, status: testResult.appointmentStatus };
        applyPaymentResult(testAppointment, testResult, 'pending');
        try {
          const [updated, payment] = await Promise.all([appointmentService.get(appointment.appointmentId), appointmentService.getPaymentStatus(appointment.appointmentId)]);
          setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
          applyPaymentResult(updated, payment, 'pending');
        } catch {
          setPaymentDialogError('The test payment response was received, but the latest appointment details could not be refreshed. Check status again.');
        }
        setPaymentMessage(testResult.appointmentStatus === 'CONFIRMED' && testResult.paymentStatus === 'SUCCEEDED' ? 'Test payment was confirmed by the server; no real payment was charged.' : getPaymentPresentation(testAppointment, testResult).message);
        setPaymentBusy('');
        return;
      }
      if (!await loadRazorpay() || !window.Razorpay) throw new Error('Secure checkout could not be loaded. Please try again.');
      const checkout = new window.Razorpay({
        key: order.keyId,
        amount: order.amountMinor,
        currency: order.currency,
        name: 'ChiriKaro',
        description: `Appointment with ${appointment.doctorName}`,
        order_id: order.orderId,
        handler: (result) => {
          void (async () => {
            try {
              const verified = await appointmentService.verifyPayment(appointment.appointmentId, result);
              applyPaymentResult({ ...appointment, status: verified.appointmentStatus }, verified, 'pending');
              try {
                const [updated, payment] = await Promise.all([appointmentService.get(appointment.appointmentId), appointmentService.getPaymentStatus(appointment.appointmentId)]);
                setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
                applyPaymentResult(updated, payment, 'pending');
              } catch {
                setPaymentDialogError('The server returned a payment verification result, but the latest appointment state could not be refreshed. Refresh status before taking another action.');
              }
            } catch (reason: unknown) {
              try {
                const [updated, payment] = await Promise.all([appointmentService.get(appointment.appointmentId), appointmentService.getPaymentStatus(appointment.appointmentId)]);
                setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
                applyPaymentResult(updated, payment, 'pending');
                setPaymentDialogError(`${getErrorMessage(reason, 'Payment verification is not complete.')}. The server status shown above is authoritative; refresh it before retrying.`);
              } catch {
                setPaymentDialogError(`${getErrorMessage(reason, 'Payment verification is not complete.')}. The checkout callback does not confirm payment; refresh the server status before retrying.`);
                setPaymentDialogStage('pending');
                setPaymentDialogOpen(true);
              }
            } finally { setPaymentBusy(''); }
          })();
        },
        modal: { ondismiss: () => {
          void Promise.all([appointmentService.get(appointment.appointmentId), appointmentService.getPaymentStatus(appointment.appointmentId)]).then(([updated, payment]) => {
            setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
            applyPaymentResult(updated, payment, 'dismissed');
          }).catch(() => {
            setPaymentDialogError('Checkout was closed. Payment status could not be refreshed; this is not a verified payment failure.');
            setPaymentDialogStage('dismissed');
            setPaymentDialogOpen(true);
          }).finally(() => setPaymentBusy(''));
        } },
      });
      setPaymentDialogOpen(false);
      window.setTimeout(() => checkout.open(), 0);
    } catch (reason) {
      setPaymentDialogError(getErrorMessage(reason, 'Could not start secure payment.'));
      setPaymentDialogStage('initialization-error');
      setPaymentDialogOpen(true);
      setPaymentBusy('');
    }
  };

  useEffect(() => {
    let active = true;
    void appointmentService.list().then((result) => {
      if (active) {
        setAppointments(result);
        const appointmentIndex = result.findIndex((appointment) => appointment.appointmentId === focusAppointmentId);
        if (appointmentIndex >= 0) setCurrentPage(Math.floor(appointmentIndex / pageSize) + 1);
      }
    }).catch((reason: unknown) => {
      if (active) setError(getErrorMessage(reason, 'Could not load appointments.'));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [focusAppointmentId]);

  return <Card className="overflow-hidden">
    <SectionHeading title="My appointments" description="Booking status and appointment details associated with your account." />
    <div className="grid gap-3 p-4.5">
      {loading ? <p className="m-0 text-sm text-text-muted">Loading appointments…</p> : null}
      {error ? <p role="alert" className="m-0 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}
      {paymentMessage ? <p role="status" className="m-0 rounded-md border border-info/20 bg-info-soft p-3 text-sm text-info">{paymentMessage}</p> : null}
      {!loading && !error ? <nav aria-label="Appointment filters" className="flex flex-wrap gap-2 border-b border-border pb-3">
        {([
          ['all', 'All appointments'], ['upcoming', 'Upcoming'], ['pending', 'Pending payment'], ['completed', 'Completed'], ['cancelled', 'Cancelled'],
        ] as const).map(([filter, label]) => <button key={filter} type="button" aria-pressed={activeFilter === filter} onClick={() => { setActiveFilter(filter); setCurrentPage(1); }} className={`min-h-10 rounded-md border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${activeFilter === filter ? 'border-primary bg-primary-soft text-primary-hover' : 'border-border bg-surface text-text-secondary hover:bg-page'}`}>{label}<span className="ml-2 text-xs text-text-muted">{appointments.filter((appointment) => filter === 'all' || (filter === 'upcoming' ? appointment.status === 'CONFIRMED' : filter === 'pending' ? appointment.status === 'PENDING_PAYMENT' : appointment.status === filter.toUpperCase())).length}</span></button>)}
      </nav> : null}
      {!loading && !error && appointments.length === 0 ? <div className="rounded-lg border border-border bg-surface"><EmptyState><p className="m-0 font-semibold text-text-secondary">You don’t have appointment requests yet.</p><Link to="/patient/clinics" className="mt-3 inline-flex rounded-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Find a clinic</Link></EmptyState></div> : null}
      {!loading && !error && appointments.length > 0 && filteredAppointments.length === 0 ? <div className="rounded-lg border border-border bg-surface"><EmptyState><p className="m-0">No {activeFilter === 'pending' ? 'pending payment' : activeFilter} appointments.</p><Button type="button" size="sm" variant="secondary" className="mt-3" onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}>Show all appointments</Button></EmptyState></div> : null}
      {visibleAppointments.map((appointment) => <article id={`appointment-${appointment.appointmentId}`} tabIndex={-1} key={appointment.appointmentId} className="scroll-mt-6 rounded-lg border border-border bg-surface-elevated p-4 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-semibold">{appointment.clinicName} · {appointment.doctorName}</p>
            <p className="mt-1 mb-0 text-sm">{appointment.localDate} · {appointment.localStartTime}–{appointment.localEndTime}</p>
          </div>
          <PatientAppointmentStatusBadge appointment={appointment} />
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="m-0 text-sm font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: appointment.feeCurrency }).format(appointment.feeAmountMinor / 100)}</p>
          <Link to={`/patient/appointments/${encodeURIComponent(appointment.appointmentId)}`} className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">View appointment details</Link>
          {appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired ? <p className="mb-0 mt-1 text-sm text-warning">Payment is required before this appointment is confirmed. The slot hold expires at {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(appointment.holdExpiresAt))}.</p> : null}
          {appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired ? <Button size="sm" className="mt-3" disabled={Boolean(paymentBusy)} onClick={() => { setPaymentTarget(appointment); setPaymentOrderAmount(undefined); setPaymentDialogError(''); setPaymentDialogStage('summary'); setPaymentDialogOpen(true); }}>{paymentBusy === appointment.appointmentId ? 'Processing payment…' : 'Review payment'}</Button> : null}
          {['PENDING_PAYMENT', 'CANCELLED'].includes(appointment.status) ? <Button size="sm" variant="secondary" className="ml-2 mt-3" disabled={Boolean(paymentBusy)} onClick={() => { setPaymentTarget(appointment); setPaymentOrderAmount(undefined); setPaymentDialogStage('processing'); setPaymentDialogError(''); setPaymentDialogOpen(true); void refreshPaymentStatus(appointment.appointmentId); }}>Check payment status{paymentStatuses[appointment.appointmentId] ? ` · ${paymentStatuses[appointment.appointmentId].paymentStatus.toLowerCase()}` : ''}</Button> : null}
          {paymentStatuses[appointment.appointmentId] ? <p role="status" className="mb-0 mt-2 text-sm text-text-secondary">{getPaymentPresentation(appointment, paymentStatuses[appointment.appointmentId]).title}</p> : null}
          {appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? <p className="mb-0 mt-1 text-sm text-warning">This payment hold expired. Start a new booking to request another slot.</p> : null}
          {appointment.cancellationRefundReviewStatus === 'PENDING_REVIEW' ? <p className="mb-0 mt-1 text-sm text-warning">Paid cancellation is pending manual refund review. No automatic refund has been issued.</p> : null}
          {['PENDING_PAYMENT', 'CONFIRMED'].includes(appointment.status) ? <p className="mb-0 mt-2 text-sm text-text-muted">Cancellation and rescheduling close 24 hours before the appointment. One reschedule is allowed; paid cancellation may require manual refund review.</p> : null}
          {appointment.changeHistory.length > 0 ? <details className="mt-3 text-sm text-text-secondary"><summary className="w-fit cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Appointment change history ({appointment.changeHistory.length})</summary>{appointment.changeHistory.map((change, index) => <p key={`${change.type}-${index}`} className="mb-0 mt-2">{change.type === 'CANCELLED' ? 'Cancelled' : 'Rescheduled'} · previous time {change.previousLocalDate}, {change.previousLocalStartTime}–{change.previousLocalEndTime} · {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(change.changedAt))}</p>)}</details> : null}
          {(['CONFIRMED'].includes(appointment.status) || (appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired)) && appointment.changeWindowOpen ? <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={changeBusy} onClick={() => { setError(''); setReschedulingId(''); setCancellationTarget(appointment); }}>Cancel appointment</Button>
            {appointment.rescheduleCount < 1 ? <Button size="sm" variant="secondary" disabled={changeBusy} onClick={() => {
              setError(''); setCancellationTarget(null); setReschedulingId(appointment.appointmentId); setRescheduleTarget('');
              void loadRescheduleAvailability(appointment, appointment.localDate);
            }}>Reschedule once</Button> : <span className="self-center text-xs text-[#737987]">Reschedule limit used</span>}
          </div> : null}
          {reschedulingId === appointment.appointmentId ? <section className="mt-4 rounded-lg border border-border bg-primary-soft/50 p-4 sm:p-5" aria-label="Choose a new appointment time">
              <label className="grid max-w-xs gap-2 text-sm font-semibold text-text-primary">New appointment date
              <input type="date" required value={rescheduleDate} onChange={(event) => void loadRescheduleAvailability(appointment, event.target.value)} className="min-h-11 rounded-md border border-border-strong bg-surface-elevated px-3 py-2 text-sm text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />
            </label>
            {rescheduleAvailability ? <div className="mt-4"><p className="m-0 text-sm text-text-secondary">Available appointment times</p>
              {rescheduleAvailability.slots.length ? <div className="mt-2 flex flex-wrap gap-2">{rescheduleAvailability.slots.map((slot) => <Button key={slot.startAt} size="sm" variant={rescheduleTarget === slot.startAt ? 'primary' : 'secondary'} onClick={() => setRescheduleTarget(slot.startAt)}>{slot.localStartTime}–{slot.localEndTime}</Button>)}</div> : <p className="mb-0 mt-2 text-xs text-[#737987]">No available times on this date.</p>}
            </div> : <p className="mb-0 mt-2 text-xs text-[#737987]">Loading available times…</p>}
            <p className="mb-3 mt-4 text-sm text-text-muted">One reschedule is allowed, at least 24 hours before the current appointment. The existing fee/payment remains unchanged.</p>
            <div className="flex flex-wrap gap-2"><Button size="sm" disabled={!rescheduleTarget || changeBusy} onClick={() => setRescheduleConfirmationOpen(true)}>Review new time</Button><Button size="sm" variant="secondary" disabled={changeBusy} onClick={() => setReschedulingId('')}>Close</Button></div>
          </section> : null}
        </div>
      </article>)}
      {!loading && !error && filteredAppointments.length > 0 ? <div className="rounded-lg border border-border bg-surface-elevated"><ListPagination page={safePage} totalPages={pageCount} totalItems={filteredAppointments.length} busy={loading} size="sm" onPageChange={setCurrentPage} /></div> : null}
      <div><Link to="/patient/clinics"><Button size="sm" variant="secondary">Find care</Button></Link></div>
    </div>
    <Dialog
      open={cancellationTarget !== null}
      onClose={() => { if (!changeBusy) setCancellationTarget(null); }}
      title="Cancel appointment?"
      description="Please review this appointment before confirming its cancellation."
      variant="warning"
      closeOnBackdrop={!changeBusy}
      closeOnEscape={!changeBusy}
      footer={(
        <>
          <DialogAction variant="secondary" disabled={changeBusy} onClick={() => setCancellationTarget(null)}>Keep appointment</DialogAction>
          <DialogAction disabled={changeBusy} onClick={() => void cancelAppointment()}>
            {changeBusy ? 'Cancelling…' : 'Confirm cancellation'}
          </DialogAction>
        </>
      )}
    >
      {cancellationTarget ? <div className="space-y-3 text-sm leading-relaxed text-text-secondary">
        <p className="m-0 font-semibold text-text-primary">{cancellationTarget.clinicName} · {cancellationTarget.doctorName}</p>
        <p className="m-0">{cancellationTarget.localDate} · {cancellationTarget.localStartTime}–{cancellationTarget.localEndTime}</p>
        <p className="m-0">If payment has been captured, the cancellation will go to manual refund review. No automatic refund will be issued.</p>
      </div> : null}
      {error ? <p role="alert" className="mt-3 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}
    </Dialog>
    <Dialog
      open={rescheduleConfirmationOpen}
      onClose={() => { if (!changeBusy) setRescheduleConfirmationOpen(false); }}
      title="Confirm rescheduled time?"
      description="The server will recheck eligibility and current availability before changing this appointment."
      variant="warning"
      closeOnBackdrop={!changeBusy}
      closeOnEscape={!changeBusy}
      footer={<>
        <DialogAction variant="secondary" disabled={changeBusy} onClick={() => setRescheduleConfirmationOpen(false)}>Go back</DialogAction>
        <DialogAction disabled={changeBusy} onClick={() => {
          const target = appointments.find((appointment) => appointment.appointmentId === reschedulingId);
          if (target) void submitReschedule(target).then((succeeded) => { if (succeeded) setRescheduleConfirmationOpen(false); });
        }}>{changeBusy ? 'Updating…' : 'Confirm new time'}</DialogAction>
      </>}
    >
      {appointments.find((appointment) => appointment.appointmentId === reschedulingId) ? <div className="space-y-2 text-sm text-text-secondary">
        <p className="m-0 font-semibold text-text-primary">{appointments.find((appointment) => appointment.appointmentId === reschedulingId)?.clinicName} · {appointments.find((appointment) => appointment.appointmentId === reschedulingId)?.doctorName}</p>
        <p className="m-0">{rescheduleDate} · {(() => { const slot = rescheduleAvailability?.slots.find((item) => item.startAt === rescheduleTarget); return slot ? `${slot.localStartTime}–${slot.localEndTime}` : 'Selected time'; })()}</p>
      </div> : null}
      {error ? <p role="alert" className="mt-3 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}
    </Dialog>
    <Dialog
      open={paymentDialogOpen && paymentTarget !== null}
      onClose={() => { if (!paymentBusy) setPaymentDialogOpen(false); }}
      title={paymentDialogStage === 'summary' ? 'Review appointment payment' : paymentDialogStage === 'processing' ? 'Processing payment…' : paymentDialogStage === 'success' ? 'Payment confirmed' : paymentDialogStage === 'failure' ? 'Payment failed' : paymentDialogStage === 'initialization-error' ? 'Could not start payment' : paymentDialogStage === 'dismissed' ? 'Checkout closed' : 'Payment status pending'}
      description={paymentDialogStage === 'summary' ? 'Review the appointment and amount before continuing to secure checkout.' : paymentDialogStage === 'success' ? 'The server has verified payment and appointment confirmation.' : 'Payment and appointment statuses are based on the server response.'}
      variant={paymentDialogStage === 'success' ? 'success' : paymentDialogStage === 'failure' || paymentDialogStage === 'initialization-error' ? 'error' : 'default'}
      closeOnBackdrop={!paymentBusy}
      closeOnEscape={!paymentBusy}
      footer={paymentTarget ? <>
        {paymentDialogStage === 'summary' ? <>
          <DialogAction variant="secondary" disabled={Boolean(paymentBusy)} onClick={() => setPaymentDialogOpen(false)}>Cancel</DialogAction>
          <DialogAction disabled={Boolean(paymentBusy)} onClick={() => void payForAppointment(paymentTarget)}>Continue to secure payment</DialogAction>
        </> : null}
        {paymentDialogStage === 'processing' ? <DialogAction disabled onClick={() => undefined}>Processing…</DialogAction> : null}
        {paymentDialogStage === 'success' ? <DialogAction onClick={() => setPaymentDialogOpen(false)}>Done</DialogAction> : null}
        {paymentDialogStage !== 'summary' && paymentDialogStage !== 'processing' && paymentDialogStage !== 'success' ? <>
          <DialogAction variant="secondary" disabled={Boolean(paymentBusy)} onClick={() => setPaymentDialogOpen(false)}>Close</DialogAction>
          {paymentDialogStage === 'pending' || paymentDialogStage === 'dismissed' ? <DialogAction variant="secondary" disabled={Boolean(paymentBusy)} onClick={() => void refreshPaymentStatus(paymentTarget.appointmentId)}>Refresh status</DialogAction> : null}
          {getPaymentPresentation(paymentTarget, paymentStatuses[paymentTarget.appointmentId] ?? null).retryAvailable ? <DialogAction disabled={Boolean(paymentBusy)} onClick={() => void payForAppointment(paymentTarget)}>Retry payment</DialogAction> : null}
        </> : null}
      </> : null}
    >
      {paymentTarget ? <PatientPaymentSummary appointment={paymentTarget} payment={paymentStatuses[paymentTarget.appointmentId] ?? null} amountMinor={paymentOrderAmount} /> : null}
      {paymentDialogStage === 'processing' ? <p role="status" aria-live="polite" className="m-0 text-sm text-text-secondary">{paymentBusy ? 'Preparing secure checkout or refreshing payment status…' : 'Waiting for the server payment result…'}</p> : null}
      {paymentDialogStage === 'dismissed' ? <p className="mb-0 mt-3 text-sm text-text-secondary">Checkout was dismissed. The server status is shown above; dismissal alone does not mean payment failed or succeeded.</p> : null}
      {paymentDialogError ? <p role="alert" className="mt-3 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">{paymentDialogError}</p> : null}
    </Dialog>
  </Card>;
}
