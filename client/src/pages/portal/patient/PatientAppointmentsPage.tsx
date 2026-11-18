import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { appointmentService } from '@/features/patient/services/appointmentService';
import { publicDirectoryService } from '@/features/patient/services/publicDirectoryService';
import { getErrorMessage } from '@/shared/lib/http';
import type { DatedAvailability, PatientAppointment } from '@/shared/types';

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

  const loadRescheduleAvailability = async (appointment: PatientAppointment, date: string) => {
    setRescheduleDate(date);
    setRescheduleAvailability(null);
    setRescheduleTarget('');
    try {
      setRescheduleAvailability(await publicDirectoryService.availability(appointment.listingId, date));
    } catch (reason) { setError(getErrorMessage(reason, 'Could not load new appointment times.')); }
  };

  const cancelAppointment = async (appointment: PatientAppointment) => {
    const message = 'Cancel this appointment? If payment has been captured, the cancellation will go to manual refund review. No automatic refund will be issued.';
    if (!window.confirm(message)) return;
    setChangeBusy(true);
    setError('');
    try {
      const updated = await appointmentService.cancel(appointment.appointmentId);
      setAppointments((current) => current.map((item) => item.appointmentId === updated.appointmentId ? updated : item));
      if (updated.cancellationRefundReviewStatus === 'PENDING_REVIEW') setPaymentMessage('Appointment cancelled. Your paid cancellation is pending manual refund review.');
      setReschedulingId('');
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
    <div className="grid gap-3 p-[18px]">
      {loading ? <p className="m-0 text-sm text-[#777d8a]">Loading appointments…</p> : null}
      {error ? <p role="alert" className="m-0 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      {paymentMessage ? <p role="status" className="m-0 rounded-md bg-blue-50 p-3 text-sm text-blue-800">{paymentMessage}</p> : null}
      {!loading && !error && appointments.length === 0 ? <div className="rounded-md bg-[#f7f8fb] p-4"><p className="m-0 text-sm text-[#686e7b]">You don’t have appointment requests yet.</p><Link to="/patient/clinics" className="mt-2 inline-block text-sm font-semibold text-brand-deep">Find a clinic</Link></div> : null}
      {appointments.map((appointment) => <article key={appointment.appointmentId} className="rounded-lg border border-[#e6e7ee] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="m-0 text-sm font-semibold">{appointment.clinicName} · {appointment.doctorName}</p>
            <p className="mt-1 mb-0 text-sm">{appointment.localDate} · {appointment.localStartTime}–{appointment.localEndTime}</p>
            <p className="mt-1 mb-0 text-xs text-[#737987]">Clinic local time ({appointment.timeZone})</p>
            <p className="mt-2 mb-0 text-[10px] text-[#8a8e9a]">Appointment {appointment.appointmentId}</p>
          </div>
          <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900">{appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? 'HOLD EXPIRED' : appointment.status.replaceAll('_', ' ')}</span>
        </div>
        <div className="mt-3 border-t border-[#eff0f4] pt-3">
          <p className="m-0 text-sm font-semibold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: appointment.feeCurrency }).format(appointment.feeAmountMinor / 100)}</p>
          {appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired ? <p className="mb-0 mt-1 text-xs text-[#7b5e20]">Payment is required before this appointment is confirmed. The slot hold expires {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(appointment.holdExpiresAt))}.</p> : null}
          {appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired ? <Button size="sm" className="mt-3" disabled={paymentBusy === appointment.appointmentId} onClick={() => void payForAppointment(appointment)}>{paymentBusy === appointment.appointmentId ? 'Checking payment…' : 'Pay securely'}</Button> : null}
          {['PENDING_PAYMENT', 'CANCELLED'].includes(appointment.status) ? <Button size="sm" variant="secondary" className="ml-2 mt-3" disabled={paymentBusy === appointment.appointmentId} onClick={() => void refreshPaymentStatus(appointment.appointmentId)}>Check payment status{paymentStatuses[appointment.appointmentId] ? ` · ${paymentStatuses[appointment.appointmentId].toLowerCase()}` : ''}</Button> : null}
          {appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? <p className="mb-0 mt-1 text-xs text-[#7b5e20]">This payment hold expired. Start a new booking to request another slot.</p> : null}
          {appointment.cancellationRefundReviewStatus === 'PENDING_REVIEW' ? <p className="mb-0 mt-1 text-xs text-[#7b5e20]">Paid cancellation is pending manual refund review. No automatic refund has been issued.</p> : null}
          {['PENDING_PAYMENT', 'CONFIRMED'].includes(appointment.status) ? <p className="mb-0 mt-2 text-xs text-[#737987]">Cancellation and rescheduling close 24 hours before the appointment. One reschedule is allowed; paid cancellation may require manual refund review.</p> : null}
          {appointment.changeHistory.length > 0 ? <details className="mt-2 text-xs text-[#737987]"><summary className="cursor-pointer">Appointment change history ({appointment.changeHistory.length})</summary>{appointment.changeHistory.map((change, index) => <p key={`${change.type}-${index}`} className="mb-0 mt-1">{change.type === 'CANCELLED' ? 'Cancelled' : 'Rescheduled'} · previous time {change.previousLocalDate}, {change.previousLocalStartTime}–{change.previousLocalEndTime} · {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(change.changedAt))}</p>)}</details> : null}
          {(['CONFIRMED'].includes(appointment.status) || (appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired)) && appointment.changeWindowOpen ? <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" disabled={changeBusy} onClick={() => void cancelAppointment(appointment)}>Cancel appointment</Button>
            {appointment.rescheduleCount < 1 ? <Button size="sm" variant="secondary" disabled={changeBusy} onClick={() => {
              setError(''); setReschedulingId(appointment.appointmentId); setRescheduleTarget('');
              void loadRescheduleAvailability(appointment, appointment.localDate);
            }}>Reschedule once</Button> : <span className="self-center text-xs text-[#737987]">Reschedule limit used</span>}
          </div> : null}
          {reschedulingId === appointment.appointmentId ? <section className="mt-3 rounded-md bg-[#f8f9ff] p-3" aria-label="Choose a new appointment time">
            <label className="grid max-w-xs gap-1.5 text-xs font-semibold text-[#555b69]">New appointment date
              <input type="date" value={rescheduleDate} min={new Date().toISOString().slice(0, 10)} onChange={(event) => void loadRescheduleAvailability(appointment, event.target.value)} className="rounded-md border border-[#dce2f1] bg-white px-3 py-2 text-sm" />
            </label>
            {rescheduleAvailability ? <div className="mt-3"><p className="m-0 text-xs text-[#737987]">Clinic local time ({rescheduleAvailability.clinicTimeZone})</p>
              {rescheduleAvailability.slots.length ? <div className="mt-2 flex flex-wrap gap-2">{rescheduleAvailability.slots.map((slot) => <Button key={slot.startAt} size="sm" variant={rescheduleTarget === slot.startAt ? 'primary' : 'secondary'} onClick={() => setRescheduleTarget(slot.startAt)}>{slot.localStartTime}–{slot.localEndTime}</Button>)}</div> : <p className="mb-0 mt-2 text-xs text-[#737987]">No available times on this date.</p>}
            </div> : <p className="mb-0 mt-2 text-xs text-[#737987]">Loading available times…</p>}
            <p className="mb-2 mt-3 text-xs text-[#737987]">One reschedule is allowed, at least 24 hours before the current appointment. The existing fee/payment remains unchanged.</p>
            <div className="flex gap-2"><Button size="sm" disabled={!rescheduleTarget || changeBusy} onClick={() => void submitReschedule(appointment)}>{changeBusy ? 'Updating…' : 'Confirm new time'}</Button><Button size="sm" variant="secondary" disabled={changeBusy} onClick={() => setReschedulingId('')}>Close</Button></div>
          </section> : null}
        </div>
      </article>)}
      <div><Link to="/patient/clinics"><Button size="sm" variant="secondary">Find care</Button></Link></div>
    </div>
  </Card>;
}
