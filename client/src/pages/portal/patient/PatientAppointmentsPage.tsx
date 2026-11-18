import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { appointmentService } from '@/features/patient/services/appointmentService';
import { getErrorMessage } from '@/shared/lib/http';
import type { PatientAppointment } from '@/shared/types';

export default function PatientAppointmentsPage() {
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
          {appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? <p className="mb-0 mt-1 text-xs text-[#7b5e20]">This payment hold expired. Start a new booking to request another slot.</p> : null}
        </div>
      </article>)}
      <div><Link to="/patient/clinics"><Button size="sm" variant="secondary">Find care</Button></Link></div>
    </div>
  </Card>;
}
