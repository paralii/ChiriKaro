import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { getErrorMessage } from '@/shared/lib/http';
import { publicDirectoryService, type PublicDirectoryFilters } from '@/features/patient/services/publicDirectoryService';
import { appointmentService } from '@/features/patient/services/appointmentService';
import type { PatientAppointment, PublicDirectoryPage } from '@/shared/types';
import type { DatedAvailability } from '@/shared/types';
import { isRealDate } from '@/shared/utils/validators';
import { ListPagination } from '@/components/molecules/ListPagination';

const EMPTY_PAGE: PublicDirectoryPage = { items: [], page: 1, limit: 12, totalItems: 0, totalPages: 0 };

export default function PatientClinicsPage() {
  const [draft, setDraft] = useState({ q: '', city: '', specialization: '' });
  const [filters, setFilters] = useState<PublicDirectoryFilters>({ page: 1, limit: 12 });
  const [result, setResult] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
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
  const idempotencyKeys = useRef<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    void publicDirectoryService.search(filters).then((page) => {
      if (active) setResult(page);
    }).catch((reason: unknown) => {
      if (active) setError(getErrorMessage(reason, 'Could not search clinics and doctors.'));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [filters]);

  const updateFilters = (next: PublicDirectoryFilters) => {
    setLoading(true);
    setError('');
    setFilters(next);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSelection(null);
    setAvailability({});
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
    updateFilters({ page: 1, limit: 12 });
  };

  const loadAvailability = async (listingId: string) => {
    if (!isRealDate(date)) { setAvailabilityError('Choose a valid appointment date.'); return; }
    setLoadingListingId(listingId);
    setAvailabilityError('');
    try {
      const response = await publicDirectoryService.availability(listingId, date);
      setAvailability((current) => ({ ...current, [listingId]: response }));
    } catch (reason) {
      setAvailabilityError(getErrorMessage(reason, 'Could not load availability for this date.'));
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
      setSelection(null);
      setAvailability((current) => {
        const listing = current[chosen.listingId];
        if (!listing) return current;
        return { ...current, [chosen.listingId]: { ...listing, slots: listing.slots.filter((slot) => slot.startAt !== created.startsAt) } };
      });
    } catch (reason) {
      setBookingError(getErrorMessage(reason, 'Could not hold this appointment time. Refresh availability and try again.'));
      setAvailability((current) => {
        const updated = { ...current };
        delete updated[selection.listingId];
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
        <form onSubmit={submit} className="grid gap-4 rounded-lg border border-border bg-page p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
          <label className="grid gap-2 text-sm font-medium text-text-secondary">Clinic or doctor
            <Input value={draft.q} maxLength={100} onChange={(event) => setDraft({ ...draft, q: event.target.value })} placeholder="Name" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-text-secondary">City
            <Input value={draft.city} maxLength={100} onChange={(event) => setDraft({ ...draft, city: event.target.value })} placeholder="City" />
          </label>
          <label className="grid gap-2 text-sm font-medium text-text-secondary">Specialization
            <Input value={draft.specialization} maxLength={100} onChange={(event) => setDraft({ ...draft, specialization: event.target.value })} placeholder="For example, orthodontics" />
          </label>
          <div className="flex flex-wrap gap-2 self-end sm:col-span-2 xl:col-span-1"><Button type="submit">Search</Button><Button type="button" variant="secondary" disabled={loading || (!draft.q && !draft.city && !draft.specialization && !filters.q && !filters.city && !filters.specialization)} onClick={resetFilters}>Reset</Button></div>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <h2 className="m-0 text-base font-semibold text-text-primary">Clinic and doctor listings</h2>
          <span aria-live="polite" className="text-sm text-text-muted">{loading ? 'Searching…' : `${result.totalItems} results · Page ${result.page} of ${Math.max(result.totalPages, 1)}`}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="grid w-full max-w-xs gap-2 text-sm font-medium text-text-secondary">Appointment date
            <Input type="date" required value={date} onChange={(event) => { setDate(event.target.value); setAvailability({}); setAvailabilityError(''); setSelection(null); }} />
          </label>
        </div>
        {availabilityError ? <p role="alert" className="mt-4 rounded-md border border-danger/25 bg-danger-soft p-4 text-sm leading-relaxed text-danger">{availabilityError}</p> : null}
        {bookingError ? <p role="alert" className="mt-4 rounded-md border border-danger/25 bg-danger-soft p-4 text-sm leading-relaxed text-danger">{bookingError}</p> : null}
        {appointment ? <div role="status" className="mt-4 rounded-md border border-warning/25 bg-warning-soft p-4 text-sm leading-relaxed text-warning">
          <strong>Appointment held pending payment</strong>
          <p className="mb-0 mt-1">Your appointment is not confirmed yet. Complete payment within 10 minutes, by {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(appointment.holdExpiresAt))}. You can pay from My appointments.</p>
          <Link className="mt-2 inline-block min-h-9 rounded-sm font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" to="/patient/appointments">View appointments</Link>
        </div> : null}
        {error ? <p role="alert" className="mt-4 rounded-md border border-danger/25 bg-danger-soft p-4 text-sm leading-relaxed text-danger">{error}</p> : null}
        {!error && !loading && result.items.length === 0 ? <p className="mt-4 rounded-md border border-border bg-page p-5 text-sm leading-relaxed text-text-secondary">No verified listings matched those filters. Try a different name, city, or specialization.</p> : null}
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {result.items.map((listing, index) => (
            <article key={`${listing.clinicName}-${listing.doctorName}-${index}`} className="min-w-0 rounded-lg border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-wide text-primary-hover">Verified clinic</p>
                  <h3 className="mt-1 mb-0 text-lg font-semibold text-text-primary">{listing.clinicName}</h3>
                  <p className="mt-1 mb-0 text-sm leading-relaxed text-text-muted">{[listing.address, listing.city, listing.state, listing.pincode].filter(Boolean).join(', ') || 'Location details unavailable'}</p>
                </div>
                <div className="rounded-md bg-primary-soft px-3 py-2 text-left sm:text-right">
                  <span className="block text-xs text-text-muted">Consultation fee</span>
                  <strong className="text-sm font-semibold text-text-primary">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: listing.currency }).format(listing.consultationFee)}</strong>
                </div>
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <p className="m-0 text-sm font-semibold text-text-primary">{listing.professionalTitle ? `${listing.professionalTitle} ` : ''}{listing.doctorName}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {listing.specializations.map((specialization) => <span key={specialization} className="rounded-full bg-success-soft px-2.5 py-1 text-xs text-success">{specialization}</span>)}
                </div>
                {listing.phone ? <a className="mt-3 inline-flex min-h-9 items-center rounded-sm text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={`tel:${listing.phone}`}>Contact clinic: {listing.phone}</a> : null}
                <div className="mt-3 border-t border-border pt-4">
                  <Button size="sm" variant="secondary" disabled={!date || loadingListingId === listing.listingId} onClick={() => void loadAvailability(listing.listingId)}>
                    {loadingListingId === listing.listingId ? 'Loading times…' : `Show times for ${date || 'selected date'}`}
                  </Button>
                  {availability[listing.listingId]?.localDate === date ? <div className="mt-3">
                    <p className="m-0 text-sm font-medium text-text-secondary">Available appointment times</p>
                    {availability[listing.listingId]?.slots.length ? <div className="mt-2 flex flex-wrap gap-2">
                      {availability[listing.listingId]?.slots.map((slot) => <Button key={slot.startAt} type="button" size="sm" variant={selection?.listingId === listing.listingId && selection.startsAt === slot.startAt ? 'primary' : 'secondary'} onClick={() => { setBookingError(''); setSelection({ listingId: listing.listingId, date, startsAt: slot.startAt, localStartTime: slot.localStartTime, localEndTime: slot.localEndTime, clinicName: listing.clinicName, doctorName: listing.doctorName, amountMinor: Math.round(listing.consultationFee * 100), currency: listing.currency }); }}>{slot.localStartTime}–{slot.localEndTime}</Button>)}
                    </div> : <p className="mt-2 mb-0 text-sm leading-relaxed text-text-muted">No future appointment times remain for this date. Past times and closed days are hidden; choose another clinic day.</p>}
                    {availability[listing.listingId]?.slots.length ? <p className="mt-2 mb-0 text-xs leading-relaxed text-text-muted">These times use the doctor’s saved weekly hours. Availability is checked again when you request a booking.</p> : null}
                  </div> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
        {selection ? <section className="mt-5 rounded-lg border border-primary/20 bg-primary-soft/50 p-4 sm:p-5" aria-labelledby="booking-review-title">
          <h2 id="booking-review-title" className="m-0 text-base font-semibold text-text-primary">Review appointment request</h2>
          <p className="mb-0 mt-2 text-sm text-text-secondary">{selection.clinicName} · {selection.doctorName}</p>
          <p className="mb-0 mt-1 text-sm text-text-muted">{selection.date}, {selection.localStartTime}–{selection.localEndTime}</p>
          <p className="mb-3 mt-1 text-sm text-text-muted">Required payment: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: selection.currency }).format(selection.amountMinor / 100)}</p>
          <Button type="button" disabled={booking} onClick={() => void createAppointment()}>{booking ? 'Holding appointment…' : 'Request appointment hold'}</Button>
        </section> : null}
        <div className="mt-5"><ListPagination page={result.page} totalPages={result.totalPages} totalItems={result.totalItems} busy={loading} size="sm" onPageChange={(page) => updateFilters({ ...filters, page })} /></div>
      </div>
    </Card>
  );
}
