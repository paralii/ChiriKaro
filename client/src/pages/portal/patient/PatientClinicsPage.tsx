import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { EmptyState } from '@/components/molecules/EmptyState';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { DirectoryListingCard, DirectoryListingSkeleton } from '@/features/patient/components/DirectoryListingCard';
import { getErrorMessage } from '@/shared/lib/http';
import { publicDirectoryService, type PublicDirectoryFilters } from '@/features/patient/services/publicDirectoryService';
import { appointmentService, type AppointmentPaymentStatus } from '@/features/patient/services/appointmentService';
import type { PatientAppointment, PublicDirectoryPage } from '@/shared/types';
import type { DatedAvailability } from '@/shared/types';
import { isRealDate } from '@/shared/utils/validators';
import { ListPagination } from '@/components/molecules/ListPagination';
import { PatientBookingSteps, type PatientBookingStep } from '@/features/patient/components/PatientBookingSteps';

const EMPTY_PAGE: PublicDirectoryPage = { items: [], page: 1, limit: 12, totalItems: 0, totalPages: 0 };

export default function PatientClinicsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedListingId = searchParams.get('listingId') ?? '';
  const requestedDate = searchParams.get('date') ?? '';
  const requestedStart = searchParams.get('startsAt') ?? '';
  const [draft, setDraft] = useState({ q: '', city: '', specialization: '' });
  const [filters, setFilters] = useState<PublicDirectoryFilters>({ page: 1, limit: 12 });
  const [requestVersion, setRequestVersion] = useState(0);
  const [result, setResult] = useState(EMPTY_PAGE);
  const [completedRequestKey, setCompletedRequestKey] = useState('');
  const [requestError, setRequestError] = useState<{ key: string; message: string } | null>(null);
  const [date, setDate] = useState(() => requestedDate && isRealDate(requestedDate) ? requestedDate : new Date().toLocaleDateString('en-CA'));
  const [availability, setAvailability] = useState<Record<string, DatedAvailability>>({});
  const [availabilityError, setAvailabilityError] = useState('');
  const [loadingListingId, setLoadingListingId] = useState('');
  const [selection, setSelection] = useState<{
    listingId: string; date: string; startsAt: string; localStartTime: string; localEndTime: string;
    clinicName: string; doctorName: string; amountMinor: number; currency: string;
  } | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [appointment, setAppointment] = useState<PatientAppointment | null>(null);
  const [appointmentPaymentStatus, setAppointmentPaymentStatus] = useState<AppointmentPaymentStatus | null>(null);
  const [activeListingId, setActiveListingId] = useState(requestedListingId);
  const [bookingStep, setBookingStep] = useState<PatientBookingStep>(() => requestedStart ? 'review' : requestedListingId ? 'date' : 'selection');
  const idempotencyKeys = useRef<Record<string, string>>({});
  const requestKey = JSON.stringify([requestedListingId, requestedDate, requestedStart, filters, requestVersion]);
  const loading = completedRequestKey !== requestKey;
  const error = requestError?.key === requestKey ? requestError.message : '';
  const confirmed = appointment?.status === 'CONFIRMED' && appointmentPaymentStatus?.appointmentStatus === 'CONFIRMED' && appointmentPaymentStatus.paymentStatus === 'SUCCEEDED';
  const confirmationTitle = !appointment ? '' : confirmed ? 'Appointment confirmed · Payment completed'
    : appointmentPaymentStatus?.refundReviewStatus === 'PENDING_REVIEW' ? 'Payment captured · manual refund review pending'
    : appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? 'Booking hold expired'
    : appointment.status === 'PENDING_PAYMENT' && appointmentPaymentStatus?.paymentStatus === 'FAILED' ? 'Booking hold created · Payment failed'
    : appointment.status === 'PENDING_PAYMENT' && appointmentPaymentStatus?.paymentStatus === 'SUCCEEDED' ? 'Payment received · appointment not confirmed'
    : appointment.status === 'PENDING_PAYMENT' ? `Booking hold created · Payment ${appointmentPaymentStatus?.paymentStatus.toLowerCase() ?? 'status unavailable'}`
    : `Appointment ${appointment.status.toLowerCase()}`;
  const confirmationMessage = !appointment ? '' : confirmed ? 'The server reports that payment was completed and the appointment is confirmed.'
    : appointmentPaymentStatus?.refundReviewStatus === 'PENDING_REVIEW' ? 'The payment was captured after cancellation or hold expiry. The server reports manual refund review pending; this is not an active confirmed appointment.'
    : appointment.status === 'PENDING_PAYMENT' && appointmentPaymentStatus?.paymentStatus === 'SUCCEEDED' ? 'The server reports captured payment but the appointment is still pending. Check the latest payment and appointment status in My appointments before taking another action.'
    : appointment.status === 'PENDING_PAYMENT' && appointment.holdExpired ? 'The payment hold has expired. The appointment is not confirmed; choose another available time.'
    : appointment.status === 'PENDING_PAYMENT' && !appointment.holdExpired ? `The time is held until ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(appointment.holdExpiresAt))}. The appointment remains pending payment and is not confirmed. Continue to payment or check its status from My appointments.`
    : 'Review the current appointment and payment status in My appointments.';

  const activeFilters = [
    ...(filters.q ? [{ key: 'q' as const, label: 'Search', value: filters.q }] : []),
    ...(filters.city ? [{ key: 'city' as const, label: 'City', value: filters.city }] : []),
    ...(filters.specialization ? [{ key: 'specialization' as const, label: 'Specialization', value: filters.specialization }] : []),
  ];

  useEffect(() => {
    let active = true;
    const search = requestedListingId
      ? publicDirectoryService.doctorProfile(requestedListingId).then(async (profile) => {
        const listing = {
          listingId: profile.listingId,
          clinicName: profile.clinic.name,
          address: profile.clinic.address,
          city: profile.clinic.city,
          state: profile.clinic.state,
          pincode: profile.clinic.pincode,
          phone: profile.clinic.phone,
          doctorName: profile.name,
          professionalTitle: profile.professionalTitle,
          specializations: profile.specializations,
          consultationFee: profile.consultationFee,
          currency: profile.currency,
        };
        if (!active) return;
        setDate(requestedDate && isRealDate(requestedDate) ? requestedDate : new Date().toLocaleDateString('en-CA'));
        setActiveListingId(profile.listingId);
        setAvailability({});
        setSelection(null);
        setResult({ items: [listing], page: 1, limit: 1, totalItems: 1, totalPages: 1 });
        if (requestedDate && requestedStart && isRealDate(requestedDate)) {
          try {
            const datedAvailability = await publicDirectoryService.availability(profile.listingId, requestedDate);
            if (!active) return;
            setAvailability({ [profile.listingId]: datedAvailability });
            const selectedSlot = datedAvailability.slots.find((slot) => slot.startAt === requestedStart);
            if (selectedSlot) {
              setSelection({ listingId: profile.listingId, date: requestedDate, startsAt: selectedSlot.startAt, localStartTime: selectedSlot.localStartTime, localEndTime: selectedSlot.localEndTime, clinicName: profile.clinic.name, doctorName: profile.name, amountMinor: Math.round(profile.consultationFee * 100), currency: profile.currency });
              setBookingStep('review');
            } else {
              setAvailabilityError('That time is no longer available. Choose another available time.');
              setBookingStep('time');
            }
          } catch (reason) {
            if (active) setAvailabilityError(getErrorMessage(reason, 'Could not load the selected appointment time.'));
          }
        }
      })
      : publicDirectoryService.search(filters).then((page) => { if (active) setResult(page); });
    void search.catch((reason: unknown) => {
      if (active) setRequestError({ key: requestKey, message: getErrorMessage(reason, 'Could not search clinics and doctors.') });
    }).finally(() => {
      if (active) setCompletedRequestKey(requestKey);
    });
    return () => { active = false; };
  }, [filters, requestedListingId, requestedDate, requestedStart, requestKey]);

  const updateFilters = (next: PublicDirectoryFilters) => {
    setRequestVersion((version) => version + 1);
    setFilters(next);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelection(null);
    setAvailability({});
    setAvailabilityError('');
    if (requestedListingId) setSearchParams({});
    const next: PublicDirectoryFilters = { page: 1, limit: 12 };
    if (draft.q.trim()) next.q = draft.q.trim();
    if (draft.city.trim()) next.city = draft.city.trim();
    if (draft.specialization.trim()) next.specialization = draft.specialization.trim();
    updateFilters(next);
  };

  const resetFilters = () => {
    setDraft({ q: '', city: '', specialization: '' });
    setSelection(null);
    setAvailability({});
    setAvailabilityError('');
    if (requestedListingId) setSearchParams({});
    updateFilters({ page: 1, limit: 12 });
  };

  const loadAvailability = async (listingId: string) => {
    if (!isRealDate(date)) { setAvailabilityError('Choose a valid appointment date.'); return; }
    setLoadingListingId(listingId);
    setAvailabilityError('');
    try {
      const response = await publicDirectoryService.availability(listingId, date);
      setAvailability((current) => ({ ...current, [listingId]: response }));
      return true;
    } catch (reason) {
      setAvailabilityError(getErrorMessage(reason, 'Could not load availability for this date.'));
      return false;
    } finally {
      setLoadingListingId('');
    }
  };

  const createAppointment = async () => {
    if (!selection) return;
    const chosen = selection;
    const key = `${chosen.listingId}:${chosen.date}:${chosen.startsAt}`;
    const idempotencyKey = idempotencyKeys.current[key] ?? crypto.randomUUID();
    idempotencyKeys.current[key] = idempotencyKey;
    setBooking(true);
    setBookingError('');
    try {
      const created = await appointmentService.create({ listingId: chosen.listingId, date: chosen.date, startsAt: chosen.startsAt }, idempotencyKey);
      delete idempotencyKeys.current[key];
      setAppointment(created);
      setAppointmentPaymentStatus(null);
      setBookingStep('confirmation');
      try {
        const payment: AppointmentPaymentStatus = await appointmentService.getPaymentStatus(created.appointmentId);
        setAppointmentPaymentStatus(payment);
      } catch {
        setAppointmentPaymentStatus(null);
      }
      setSelection(null);
      setAvailability((current) => {
        const listing = current[chosen.listingId];
        if (!listing) return current;
        return { ...current, [chosen.listingId]: { ...listing, slots: listing.slots.filter((slot) => slot.startAt !== created.startsAt) } };
      });
    } catch (reason) {
      setBookingError(getErrorMessage(reason, 'Could not hold this appointment time. Refresh availability and try again.'));
      setBookingStep('date');
      setSelection(null);
      setAvailability((current) => {
        const updated = { ...current };
        delete updated[chosen.listingId];
        return updated;
      });
    } finally {
      setBooking(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <SectionHeading title="Find a clinic or doctor" description="Browse approved clinics and verified doctors, check a date, and request a payment hold." />
      <div className="p-4 sm:p-5">
        <PatientBookingSteps current={bookingStep} />
        <form onSubmit={submit} className="rounded-lg border border-border bg-page p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="m-0 text-sm font-semibold text-text-primary">Search care near you</h2>
            <p className="mb-0 mt-1 text-sm text-text-muted">Find verified clinics and doctors by name, city, or specialization.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,1fr))]">
          <label className="grid gap-2 text-sm font-medium text-text-secondary">Clinic or doctor
            <Input aria-label="Search clinic or doctor" value={draft.q} maxLength={100} onChange={(event) => setDraft({ ...draft, q: event.target.value })} placeholder="Search names" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-text-secondary">City
            <Input aria-label="Filter by city" value={draft.city} maxLength={100} onChange={(event) => setDraft({ ...draft, city: event.target.value })} placeholder="Enter a city" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-text-secondary">Specialization
            <Input aria-label="Filter by specialization" value={draft.specialization} maxLength={100} onChange={(event) => setDraft({ ...draft, specialization: event.target.value })} placeholder="For example, orthodontics" />
          </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
            <Button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search clinics and doctors'}</Button>
            <Button type="button" variant="secondary" disabled={loading || (!draft.q.trim() && !draft.city.trim() && !draft.specialization.trim() && activeFilters.length === 0)} onClick={resetFilters}>Clear filters</Button>
          </div>
        </form>

        {activeFilters.length ? <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active search filters">
          <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">Active filters</span>
          {activeFilters.map((filter) => <button key={filter.key} type="button" onClick={() => {
            setDraft((current) => ({ ...current, [filter.key]: '' }));
            const next = { ...filters, page: 1 };
            delete next[filter.key];
            setSelection(null);
            setAvailability({});
            updateFilters(next);
          }} className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-surface-elevated px-3 text-xs font-medium text-text-secondary transition-colors hover:border-primary hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
            <span>{filter.label}: {filter.value}</span><span aria-hidden="true" className="text-sm">×</span><span className="sr-only">Remove {filter.label.toLowerCase()} filter</span>
          </button>)}
        </div> : null}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <h2 className="m-0 text-base font-semibold text-text-primary">Clinic and doctor listings</h2>
          <span aria-live="polite" className="text-sm text-text-muted">{loading ? 'Searching…' : error ? 'Results unavailable' : `${result.totalItems} ${result.totalItems === 1 ? 'result' : 'results'}`}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="grid w-full max-w-xs gap-2 text-sm font-medium text-text-secondary">Appointment date
            <Input type="date" required value={date} onChange={(event) => { setDate(event.target.value); setAvailability({}); setAvailabilityError(''); setSelection(null); setBookingStep('date'); }} />
          </label>
          {bookingStep === 'date' ? <Button type="button" disabled={!activeListingId || !isRealDate(date) || loadingListingId === activeListingId} onClick={() => { if (activeListingId) void loadAvailability(activeListingId).then((loaded) => { if (loaded) setBookingStep('time'); }); }}>
            {loadingListingId === activeListingId ? 'Checking availability…' : 'Continue to available times'}
          </Button> : null}
        </div>
        {availabilityError ? <p role="alert" className="mt-4 rounded-md border border-danger/25 bg-danger-soft p-4 text-sm leading-relaxed text-danger">{availabilityError}</p> : null}
        {bookingError ? <p role="alert" className="mt-4 rounded-md border border-danger/25 bg-danger-soft p-4 text-sm leading-relaxed text-danger">{bookingError}</p> : null}
        {appointment && bookingStep === 'confirmation' ? <div role="status" aria-live="polite" className="mt-4 rounded-md border border-warning/25 bg-warning-soft p-4 text-sm leading-relaxed text-warning">
          <strong>{confirmationTitle}</strong>
          <p className="mb-0 mt-1">{confirmationMessage}</p>
          <Link className="mt-2 inline-block min-h-9 rounded-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" to="/patient/appointments">View appointments and payment status</Link>
        </div> : null}
        {error ? <p role="alert" className="mt-4 rounded-md border border-danger/25 bg-danger-soft p-4 text-sm leading-relaxed text-danger">{error}</p> : null}
        {!error && !loading && result.items.length === 0 ? <div className="mt-4 rounded-lg border border-border bg-page"><EmptyState>
          <p className="m-0 font-semibold text-text-secondary">No verified listings found</p>
          <p className="mb-0 mt-1">Try another name, city, or specialization, or clear your filters.</p>
          {activeFilters.length ? <Button type="button" className="mt-4" size="sm" variant="secondary" onClick={resetFilters}>Clear filters</Button> : null}
        </EmptyState></div> : null}
        <div aria-busy={loading} className="mt-4 grid gap-4 lg:grid-cols-2">
          {loading ? Array.from({ length: 4 }, (_, index) => <DirectoryListingSkeleton key={index} />) : null}
          {!loading && !error ? result.items.map((listing) => (
            <DirectoryListingCard key={listing.listingId} listing={listing}>
                  <Button size="sm" variant="secondary" disabled={loadingListingId === listing.listingId} onClick={() => { setActiveListingId(listing.listingId); setSelection(null); setBookingStep('date'); }}>
                    {activeListingId === listing.listingId ? 'Selected clinic and doctor' : 'Choose this clinic and doctor'}
                  </Button>
                  {activeListingId === listing.listingId && bookingStep === 'time' && availability[listing.listingId]?.localDate === date ? <div className="mt-3">
                    <p className="m-0 text-sm font-medium text-text-secondary">Available appointment times</p>
                    {availability[listing.listingId]?.slots.length ? <div className="mt-2 flex flex-wrap gap-2">
                      {availability[listing.listingId]?.slots.map((slot) => <Button key={slot.startAt} type="button" size="sm" variant={selection?.listingId === listing.listingId && selection.startsAt === slot.startAt ? 'primary' : 'secondary'} onClick={() => { setBookingError(''); setSelection({ listingId: listing.listingId, date, startsAt: slot.startAt, localStartTime: slot.localStartTime, localEndTime: slot.localEndTime, clinicName: listing.clinicName, doctorName: listing.doctorName, amountMinor: Math.round(listing.consultationFee * 100), currency: listing.currency }); setBookingStep('review'); }}>{slot.localStartTime}–{slot.localEndTime}</Button>)}
                    </div> : <p className="mt-2 mb-0 text-sm leading-relaxed text-text-muted">No future appointment times remain for this date. Past times and closed days are hidden; choose another clinic day.</p>}
                    {availability[listing.listingId]?.slots.length ? <p className="mt-2 mb-0 text-xs leading-relaxed text-text-muted">These times use the doctor’s saved weekly hours. Availability is checked again when you request a booking.</p> : null}
                  </div> : null}
            </DirectoryListingCard>
          )) : null}
        </div>
        {selection && bookingStep === 'review' ? <section className="mt-5 rounded-lg border border-primary/20 bg-primary-soft/50 p-4 sm:p-5" aria-labelledby="booking-review-title">
          <h2 id="booking-review-title" className="m-0 text-base font-semibold text-text-primary">Review appointment request</h2>
          <p className="mb-0 mt-2 text-sm text-text-secondary">{selection.clinicName} · {selection.doctorName}</p>
          <p className="mb-0 mt-1 text-sm text-text-muted">{selection.date}, {selection.localStartTime}–{selection.localEndTime}</p>
          <p className="mb-3 mt-1 text-sm text-text-muted">Required payment: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: selection.currency }).format(selection.amountMinor / 100)}</p>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={booking} onClick={() => setBookingStep('time')}>Back to times</Button><Button type="button" disabled={booking} onClick={() => setBookingStep('confirm')}>Continue to confirmation</Button></div>
        </section> : null}
        {selection && bookingStep === 'confirm' ? <section className="mt-5 rounded-lg border border-primary/20 bg-primary-soft/50 p-4 sm:p-5" aria-labelledby="booking-confirm-title">
          <h2 id="booking-confirm-title" className="m-0 text-base font-semibold text-text-primary">Confirm booking hold</h2>
          <p className="mb-0 mt-2 text-sm text-text-secondary">{selection.clinicName} · {selection.doctorName}</p>
          <p className="mb-0 mt-1 text-sm text-text-muted">{selection.date}, {selection.localStartTime}–{selection.localEndTime}</p>
          <p className="mb-3 mt-1 text-sm text-text-muted">Payment due: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: selection.currency }).format(selection.amountMinor / 100)}. The appointment is not confirmed until payment is verified.</p>
          <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={booking} onClick={() => setBookingStep('review')}>Back to review</Button><Button type="button" disabled={booking} onClick={() => void createAppointment()}>{booking ? 'Creating booking hold…' : 'Confirm and request hold'}</Button></div>
        </section> : null}
        {!error && !loading ? <div className="mt-5 rounded-lg border border-border bg-surface-elevated">
          <ListPagination page={result.page} totalPages={result.totalPages} totalItems={result.totalItems} busy={loading} size="sm" onPageChange={(page) => updateFilters({ ...filters, page })} />
        </div> : null}
      </div>
    </Card>
  );
}
