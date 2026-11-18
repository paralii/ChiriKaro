import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { appointmentService } from '@/features/patient/services/appointmentService';
import { getErrorMessage } from '@/shared/lib/http';
import type { PatientAppointment } from '@/shared/types';

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

  const refreshPaymentStatus = async (appointmentId: string) => {
    setPaymentBusy(appointmentId);
    try {
      const payment = await appointmentService.getPaymentStatus(appointmentId);
      const appointment = await appointmentService.get(appointmentId);
      setAppointments((current) => current.map((item) => item.appointmentId === appointmentId ? appointment : item));
      setPaymentStatuses((current) => ({ ...current, [appointmentId]: payment.paymentStatus }));
      setPaymentMessage(payment.appointmentStatus === 'CONFIRMED' ? 'Payment verified and appointment confirmed.' : payment.paymentStatus === 'FAILED' ? 'Payment failed. You can retry while the hold is active.' : 'Payment is pending verification.');
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
            setPaymentMessage(payment.appointmentStatus === 'CONFIRMED' ? 'Payment verified and appointment confirmed.' : 'Payment was received and is being reconciled. Refresh the status shortly.');
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
          {appointment.status === 'PENDING_PAYMENT' ? <Button size="sm" variant="secondary" className="ml-2 mt-3" disabled={paymentBusy === appointment.appointmentId} onClick={() => void refreshPaymentStatus(appointment.appointmentId)}>Check payment status{paymentStatuses[appointment.appointmentId] ? ` · ${paymentStatuses[appointment.appointmentId].toLowerCase()}` : ''}</Button> : null}
          {appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? <p className="mb-0 mt-1 text-xs text-[#7b5e20]">This payment hold expired. Start a new booking to request another slot.</p> : null}
        </div>
      </article>)}
      <div><Link to="/patient/clinics"><Button size="sm" variant="secondary">Find care</Button></Link></div>
    </div>
  </Card>;
}
