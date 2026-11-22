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
      <div className="p-[18px]">
        <form onSubmit={submit} className="grid gap-3 rounded-lg border border-[#e8e9ef] bg-[#fafbff] p-4 md:grid-cols-4">
          <label className="grid gap-1.5 text-xs font-semibold text-[#555b69]">Clinic or doctor
            <Input value={draft.q} maxLength={100} onChange={(event) => setDraft({ ...draft, q: event.target.value })} placeholder="Name" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-[#555b69]">City
            <Input value={draft.city} maxLength={100} onChange={(event) => setDraft({ ...draft, city: event.target.value })} placeholder="City" />
          </label>
          <label className="grid gap-1.5 text-xs font-semibold text-[#555b69]">Specialization
            <Input value={draft.specialization} maxLength={100} onChange={(event) => setDraft({ ...draft, specialization: event.target.value })} placeholder="For example, orthodontics" />
          </label>
          <Button type="submit" className="self-end">Search</Button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3">
          <h2 className="m-0 text-sm font-semibold">Clinic and doctor listings</h2>
          <span className="text-xs text-[#777d8a]">{loading ? 'Searching…' : `${result.totalItems} results`}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="grid gap-1.5 text-xs font-semibold text-[#555b69]">Appointment date
            <Input type="date" required value={date} onChange={(event) => { setDate(event.target.value); setAvailability({}); setAvailabilityError(''); setSelection(null); }} />
          </label>
        </div>
        {availabilityError ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{availabilityError}</p> : null}
        {bookingError ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{bookingError}</p> : null}
        {appointment ? <div role="status" className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Appointment held pending payment</strong>
          <p className="mb-0 mt-1">Your appointment is not confirmed yet. Complete payment within 10 minutes, by {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: appointment.timeZone }).format(new Date(appointment.holdExpiresAt))}. You can pay from My appointments.</p>
          <Link className="mt-2 inline-block font-semibold underline" to="/patient/appointments">View appointments</Link>
        </div> : null}
        {error ? <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {!error && !loading && result.items.length === 0 ? <p className="mt-4 rounded-md bg-[#f7f8fb] p-4 text-sm text-[#686e7b]">No verified listings matched those filters. Try a different name, city, or specialization.</p> : null}
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {result.items.map((listing, index) => (
            <article key={`${listing.clinicName}-${listing.doctorName}-${index}`} className="rounded-lg border border-[#e6e7ee] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-brand">Verified clinic</p>
                  <h3 className="mt-1 mb-0 text-base font-semibold">{listing.clinicName}</h3>
                  <p className="mt-1 mb-0 text-xs text-[#737987]">{[listing.address, listing.city, listing.state, listing.pincode].filter(Boolean).join(', ') || 'Location details unavailable'}</p>
                </div>
                <div className="rounded-md bg-[#f3f5ff] px-3 py-2 text-right">
                  <span className="block text-[10px] text-[#727887]">Consultation fee</span>
                  <strong className="text-sm">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: listing.currency }).format(listing.consultationFee)}</strong>
                </div>
              </div>
              <div className="mt-4 border-t border-[#eff0f4] pt-3">
                <p className="m-0 text-sm font-semibold">{listing.professionalTitle ? `${listing.professionalTitle} ` : ''}{listing.doctorName}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {listing.specializations.map((specialization) => <span key={specialization} className="rounded-full bg-[#eef5f2] px-2.5 py-1 text-[10px] text-[#376b59]">{specialization}</span>)}
                </div>
                {listing.phone ? <a className="mt-3 inline-block text-xs font-semibold text-brand-deep" href={`tel:${listing.phone}`}>Contact clinic: {listing.phone}</a> : null}
                <div className="mt-3 border-t border-[#eff0f4] pt-3">
                  <Button size="sm" variant="secondary" disabled={!date || loadingListingId === listing.listingId} onClick={() => void loadAvailability(listing.listingId)}>
                    {loadingListingId === listing.listingId ? 'Loading times…' : `Show times for ${date || 'selected date'}`}
                  </Button>
                  {availability[listing.listingId]?.localDate === date ? <div className="mt-3">
                    <p className="m-0 text-xs text-[#686e7b]">Available appointment times</p>
                    {availability[listing.listingId]?.slots.length ? <div className="mt-2 flex flex-wrap gap-2">
                      {availability[listing.listingId]?.slots.map((slot) => <Button key={slot.startAt} type="button" size="sm" variant={selection?.listingId === listing.listingId && selection.startsAt === slot.startAt ? 'primary' : 'secondary'} onClick={() => { setBookingError(''); setSelection({ listingId: listing.listingId, date, startsAt: slot.startAt, localStartTime: slot.localStartTime, localEndTime: slot.localEndTime, clinicName: listing.clinicName, doctorName: listing.doctorName, amountMinor: Math.round(listing.consultationFee * 100), currency: listing.currency }); }}>{slot.localStartTime}–{slot.localEndTime}</Button>)}
                    </div> : <p className="mt-2 mb-0 text-xs text-[#777d8a]">No future appointment times remain for this date. Past times and closed days are hidden; choose another clinic day.</p>}
                    {availability[listing.listingId]?.slots.length ? <p className="mt-2 mb-0 text-[10px] text-[#687568]">These times use the doctor’s saved weekly hours. Availability is checked again when you request a booking.</p> : null}
                  </div> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
        {selection ? <section className="mt-5 rounded-lg border border-[#dce2f1] bg-[#f8f9ff] p-4" aria-labelledby="booking-review-title">
          <h2 id="booking-review-title" className="m-0 text-sm font-semibold">Review appointment request</h2>
          <p className="mb-0 mt-2 text-sm">{selection.clinicName} · {selection.doctorName}</p>
          <p className="mb-0 mt-1 text-xs text-[#686e7b]">{selection.date}, {selection.localStartTime}–{selection.localEndTime}</p>
          <p className="mb-3 mt-1 text-xs text-[#686e7b]">Required payment: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: selection.currency }).format(selection.amountMinor / 100)}</p>
          <Button type="button" disabled={booking} onClick={() => void createAppointment()}>{booking ? 'Holding appointment…' : 'Request appointment hold'}</Button>
        </section> : null}
        {result.totalPages > 1 ? <nav aria-label="Search result pages" className="mt-5 flex items-center justify-center gap-3">
          <Button size="sm" variant="secondary" disabled={loading || result.page <= 1} onClick={() => updateFilters({ ...filters, page: result.page - 1 })}>Previous</Button>
          <span className="text-xs text-[#686e7b]">Page {result.page} of {result.totalPages}</span>
          <Button size="sm" variant="secondary" disabled={loading || result.page >= result.totalPages} onClick={() => updateFilters({ ...filters, page: result.page + 1 })}>Next</Button>
        </nav> : null}
      </div>
    </Card>
  );
}
