import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { getErrorMessage } from '@/shared/lib/http';
import { publicDirectoryService, type PublicDirectoryFilters } from '@/features/patient/services/publicDirectoryService';
import type { PublicDirectoryPage } from '@/shared/types';
import type { DatedAvailability } from '@/shared/types';

const EMPTY_PAGE: PublicDirectoryPage = { items: [], page: 1, limit: 12, totalItems: 0, totalPages: 0 };

export default function PatientClinicsPage() {
  const [draft, setDraft] = useState({ q: '', city: '', specialization: '' });
  const [filters, setFilters] = useState<PublicDirectoryFilters>({ page: 1, limit: 12 });
  const [result, setResult] = useState(EMPTY_PAGE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [date, setDate] = useState(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()));
  const [availability, setAvailability] = useState<Record<string, DatedAvailability>>({});
  const [availabilityError, setAvailabilityError] = useState('');
  const [loadingListingId, setLoadingListingId] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    void publicDirectoryService.search(filters).then((page) => {
      if (active) setResult(page);
    }).catch((reason: unknown) => {
      if (active) setError(getErrorMessage(reason, 'Could not search clinics and doctors.'));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [filters]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: PublicDirectoryFilters = { page: 1, limit: 12 };
    if (draft.q.trim()) next.q = draft.q.trim();
    if (draft.city.trim()) next.city = draft.city.trim();
    if (draft.specialization.trim()) next.specialization = draft.specialization.trim();
    setFilters(next);
  };

  const loadAvailability = async (listingId: string) => {
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

  return (
    <Card className="overflow-hidden">
      <SectionHeading title="Find a clinic or doctor" description="Browse approved clinics and verified doctors. Live appointment availability will appear in a later booking step." />
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
          <label className="grid gap-1.5 text-xs font-semibold text-[#555b69]">Appointment date <span className="font-normal text-[#777d8a]">Selected in each clinic’s timezone</span>
            <Input type="date" value={date} onChange={(event) => { setDate(event.target.value); setAvailability({}); setAvailabilityError(''); }} />
          </label>
        </div>
        {availabilityError ? <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{availabilityError}</p> : null}
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
                    <p className="m-0 text-xs text-[#686e7b]">Clinic local time ({availability[listing.listingId]?.clinicTimeZone})</p>
                    {availability[listing.listingId]?.slots.length ? <div className="mt-2 flex flex-wrap gap-2">
                      {availability[listing.listingId]?.slots.map((slot) => <span key={slot.startAt} className="rounded-md border border-[#dce2f1] bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-deep">{slot.localStartTime}–{slot.localEndTime}</span>)}
                    </div> : <p className="mt-2 mb-0 text-xs text-[#777d8a]">No schedule slots are available on this date.</p>}
                    <p className="mt-2 mb-0 text-[10px] text-[#8a6870]">Times are generated from schedules; booking will recheck availability.</p>
                  </div> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
        {result.totalPages > 1 ? <nav aria-label="Search result pages" className="mt-5 flex items-center justify-center gap-3">
          <Button size="sm" variant="secondary" disabled={loading || result.page <= 1} onClick={() => setFilters({ ...filters, page: result.page - 1 })}>Previous</Button>
          <span className="text-xs text-[#686e7b]">Page {result.page} of {result.totalPages}</span>
          <Button size="sm" variant="secondary" disabled={loading || result.page >= result.totalPages} onClick={() => setFilters({ ...filters, page: result.page + 1 })}>Next</Button>
        </nav> : null}
      </div>
    </Card>
  );
}
