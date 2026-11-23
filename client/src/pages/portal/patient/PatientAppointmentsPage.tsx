import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Dialog, DialogAction } from '@/components/atoms/Dialog';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { appointmentService } from '@/features/patient/services/appointmentService';
import { publicDirectoryService } from '@/features/patient/services/publicDirectoryService';
import { getErrorMessage } from '@/shared/lib/http';
import type { DatedAvailability, PatientAppointment } from '@/shared/types';
import { isRealDate } from '@/shared/utils/validators';

type RazorpayCheckoutOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  handler: (result: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
};
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
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentBusy, setPaymentBusy] = useState('');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, string>>({});
  const [reschedulingId, setReschedulingId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleAvailability, setRescheduleAvailability] = useState<DatedAvailability | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState('');
  const [changeBusy, setChangeBusy] = useState(false);
  const [cancellationTarget, setCancellationTarget] = useState<PatientAppointment | null>(null);

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

  const submitReschedule = async (appointment: PatientAppointment) => {
    if (!rescheduleTarget) return;
    setChangeBusy(true);
    setError('');
    try {
      const updated = await appointmentService.reschedule(appointment.appointmentId, { listingId: appointment.listingId, date: rescheduleDate, startsAt: rescheduleTarget });
      setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
      setPaymentMessage('Appointment rescheduled. Its fee and payment status were preserved.');
      setReschedulingId('');
      setRescheduleAvailability(null);
    } catch (reason) { setError(getErrorMessage(reason, 'Could not reschedule this appointment.')); }
    finally { setChangeBusy(false); }
  };

  const refreshPaymentStatus = async (appointmentId: string) => {
    setPaymentBusy(appointmentId);
    try {
      const payment = await appointmentService.getPaymentStatus(appointmentId);
      const appointment = await appointmentService.get(appointmentId);
      setAppointments((current) => current.map((item) => item.appointmentId === appointmentId ? appointment : item));
      setPaymentStatuses((current) => ({ ...current, [appointmentId]: payment.paymentStatus }));
      setPaymentMessage(payment.refundReviewStatus === 'PENDING_REVIEW' ? 'Payment was captured after cancellation or hold expiry and is pending manual refund review.' : payment.appointmentStatus === 'CONFIRMED' ? 'Payment verified and appointment confirmed.' : payment.paymentStatus === 'FAILED' ? 'Payment failed. You can retry while the hold is active.' : 'Payment is pending verification.');
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not refresh payment status.'));
    } finally { setPaymentBusy(''); }
  };

  const payForAppointment = async (appointment: PatientAppointment) => {
    setPaymentBusy(appointment.appointmentId);
    setPaymentMessage('');
    setError('');
    try {
      const order = await appointmentService.createPaymentOrder(appointment.appointmentId);
      if (order.mode === 'MOCK') {
        const payment = await appointmentService.confirmTestPayment(appointment.appointmentId);
        const updated = await appointmentService.get(appointment.appointmentId);
        setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
        setPaymentStatuses((current) => ({ ...current, [appointment.appointmentId]: payment.paymentStatus }));
        setPaymentMessage('Test payment completed. Appointment confirmed; no real payment was charged.');
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
          void appointmentService.verifyPayment(appointment.appointmentId, result).then(async () => {
            const [updated, payment] = await Promise.all([appointmentService.get(appointment.appointmentId), appointmentService.getPaymentStatus(appointment.appointmentId)]);
            setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
            setPaymentMessage(payment.refundReviewStatus === 'PENDING_REVIEW' ? 'Payment was captured after cancellation or hold expiry and is pending manual refund review.' : payment.appointmentStatus === 'CONFIRMED' ? 'Payment verified and appointment confirmed.' : 'Payment was received and is being reconciled. Refresh the status shortly.');
          }).catch((reason: unknown) => setError(getErrorMessage(reason, 'Payment is not yet verified. Check status before trying again.'))).finally(() => setPaymentBusy(''));
        },
        modal: { ondismiss: () => { void appointmentService.getPaymentStatus(appointment.appointmentId).then((payment) => {
          setPaymentMessage(payment.appointmentStatus === 'CONFIRMED' ? 'Payment verified and appointment confirmed.' : 'Checkout closed. Payment status remains pending until verified.');
        }).catch(() => setPaymentMessage('Checkout closed. You can safely check payment status or retry.')).finally(() => setPaymentBusy('')); } },
      });
      checkout.open();
    } catch (reason) {
      setError(getErrorMessage(reason, 'Could not start payment.'));
      setPaymentBusy('');
    }
  };

  useEffect(() => {
    let active = true;
    void appointmentService.list().then((result) => {
      if (active) setAppointments(result);
    }).catch((reason: unknown) => {
      if (active) setError(getErrorMessage(reason, 'Could not load appointments.'));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  return <Card className="overflow-hidden">
    <SectionHeading title="My appointments" description="Booking status and appointment details associated with your account." />
    <div className="grid gap-3 p-4.5">
      {loading ? <p className="m-0 text-sm text-text-muted">Loading appointments…</p> : null}
      {error ? <p role="alert" className="m-0 rounded-md border border-danger/20 bg-danger-soft p-3 text-sm text-danger">{error}</p> : null}
      {paymentMessage ? <p role="status" className="m-0 rounded-md border border-info/20 bg-info-soft p-3 text-sm text-info">{paymentMessage}</p> : null}
      {!loading && !error && appointments.length === 0 ? <div className="rounded-lg border border-border bg-surface p-5"><p className="m-0 text-sm text-text-secondary">You don’t have appointment requests yet.</p><Link to="/patient/clinics" className="mt-3 inline-flex rounded-sm text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Find a clinic</Link></div> : null}
      {appointments.map((appointment) => <article key={appointment.appointmentId} className="rounded-lg border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-semibold">{appointment.clinicName} · {appointment.doctorName}</p>
            <p className="mt-1 mb-0 text-sm">{appointment.localDate} · {appointment.localStartTime}–{appointment.localEndTime}</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${appointment.status === 'CONFIRMED' ? 'bg-success-soft text-success' : appointment.status === 'CANCELLED' ? 'bg-danger-soft text-danger' : appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? 'bg-surface text-text-muted' : 'bg-warning-soft text-warning'}`}>{appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? 'HOLD EXPIRED' : appointment.status.replaceAll('_', ' ')}</span>
        </div>
        <div className="mt-4 border-t border-border pt-4">
          <p className="m-0 text-sm font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: appointment.feeCurrency }).format(appointment.feeAmountMinor / 100)}</p>
          {appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired ? <p className="mb-0 mt-1 text-sm text-warning">Payment is required before this appointment is confirmed. The slot hold expires at {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(appointment.holdExpiresAt))}.</p> : null}
          {appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired ? <Button size="sm" className="mt-3" disabled={paymentBusy === appointment.appointmentId} onClick={() => void payForAppointment(appointment)}>{paymentBusy === appointment.appointmentId ? 'Processing payment…' : 'Continue to payment'}</Button> : null}
          {['PENDING_PAYMENT', 'CANCELLED'].includes(appointment.status) ? <Button size="sm" variant="secondary" className="ml-2 mt-3" disabled={paymentBusy === appointment.appointmentId} onClick={() => void refreshPaymentStatus(appointment.appointmentId)}>Check payment status{paymentStatuses[appointment.appointmentId] ? ` · ${paymentStatuses[appointment.appointmentId].toLowerCase()}` : ''}</Button> : null}
          {appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? <p className="mb-0 mt-1 text-sm text-warning">This payment hold expired. Start a new booking to request another slot.</p> : null}
          {appointment.cancellationRefundReviewStatus === 'PENDING_REVIEW' ? <p className="mb-0 mt-1 text-sm text-warning">Paid cancellation is pending manual refund review. No automatic refund has been issued.</p> : null}
          {['PENDING_PAYMENT', 'CONFIRMED'].includes(appointment.status) ? <p className="mb-0 mt-2 text-sm text-text-muted">Cancellation and rescheduling close 24 hours before the appointment. One reschedule is allowed; paid cancellation may require manual refund review.</p> : null}
          {appointment.changeHistory.length > 0 ? <details className="mt-3 text-sm text-text-secondary"><summary className="w-fit cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Appointment change history ({appointment.changeHistory.length})</summary>{appointment.changeHistory.map((change, index) => <p key={`${change.type}-${index}`} className="mb-0 mt-2">{change.type === 'CANCELLED' ? 'Cancelled' : 'Rescheduled'} · previous time {change.previousLocalDate}, {change.previousLocalStartTime}–{change.previousLocalEndTime} · {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(change.changedAt))}</p>)}</details> : null}
          {(['CONFIRMED'].includes(appointment.status) || (appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired)) && appointment.changeWindowOpen ? <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={changeBusy} onClick={() => { setError(''); setCancellationTarget(appointment); }}>Cancel appointment</Button>
            {appointment.rescheduleCount < 1 ? <Button size="sm" variant="secondary" disabled={changeBusy} onClick={() => {
              setError(''); setReschedulingId(appointment.appointmentId); setRescheduleTarget('');
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
            <div className="flex flex-wrap gap-2"><Button size="sm" disabled={!rescheduleTarget || changeBusy} onClick={() => void submitReschedule(appointment)}>{changeBusy ? 'Updating…' : 'Confirm new time'}</Button><Button size="sm" variant="secondary" disabled={changeBusy} onClick={() => setReschedulingId('')}>Close</Button></div>
          </section> : null}
        </div>
      </article>)}
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
    </Dialog>
  </Card>;
}
