import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Notice } from '@/components/atoms/Notice';
import { DetailList } from '@/components/molecules/DetailList';
import { PageHeading } from '@/components/molecules/PageHeading';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { publicDirectoryService } from '@/features/patient/services/publicDirectoryService';
import { getErrorMessage } from '@/shared/lib/http';
import type { DatedAvailability, PublicDoctorProfile } from '@/shared/types';
import { isRealDate } from '@/shared/utils/validators';

export default function PatientDoctorProfilePage() {
  const { listingId = '' } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicDoctorProfile | null>(null);
  const [loadedListingId, setLoadedListingId] = useState('');
  const [profileError, setProfileError] = useState<{ listingId: string; message: string; notFound: boolean } | null>(null);
  const loading = loadedListingId !== listingId;
  const error = profileError?.listingId === listingId ? profileError.message : '';
  const notFound = profileError?.listingId === listingId && profileError.notFound;
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [availability, setAvailability] = useState<DatedAvailability | null>(null);
  const [availabilityRequestKey, setAvailabilityRequestKey] = useState('');
  const [availabilityFailure, setAvailabilityFailure] = useState<{ key: string; message: string } | null>(null);
  const currentAvailabilityKey = `${listingId}:${date}`;
  const availabilityLoading = Boolean(profile) && availabilityRequestKey !== currentAvailabilityKey;
  const availabilityError = availabilityFailure?.key === currentAvailabilityKey ? availabilityFailure.message : '';
  const currentAvailability = availabilityRequestKey === currentAvailabilityKey ? availability : null;

  useEffect(() => {
    let active = true;
    void publicDirectoryService.doctorProfile(listingId).then((result) => {
      if (active) { setProfile(result); setProfileError(null); }
    }).catch((reason: unknown) => {
      if (!active) return;
      setProfileError({ listingId, notFound: axios.isAxiosError(reason) && reason.response?.status === 404, message: getErrorMessage(reason, 'Could not load this doctor profile.') });
    }).finally(() => { if (active) setLoadedListingId(listingId); });
    return () => { active = false; };
  }, [listingId]);

  useEffect(() => {
    if (!profile || !isRealDate(date)) return;
    let active = true;
    const requestKey = `${listingId}:${date}`;
    void publicDirectoryService.availability(profile.listingId, date).then((result) => {
      if (active) { setAvailability(result); setAvailabilityFailure(null); setAvailabilityRequestKey(requestKey); }
    }).catch((reason: unknown) => {
      if (active) { setAvailabilityFailure({ key: requestKey, message: getErrorMessage(reason, 'Could not load appointment availability.') }); setAvailabilityRequestKey(requestKey); }
    });
    return () => { active = false; };
  }, [profile, date, listingId]);

  const bookSelectedTime = (startsAt: string) => {
    const params = new URLSearchParams({ listingId, date, startsAt });
    navigate(`/patient/clinics?${params.toString()}`);
  };

  return <>
    <div className="mb-5"><Link to="/patient/clinics" className="text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">← Back to discovery</Link></div>
    <PageHeading eyebrow="DOCTOR PROFILE" title={loading ? 'Loading doctor…' : profile?.name ?? 'Doctor profile'} chip={profile?.professionalTitle ?? undefined} />
    {loading ? <div aria-busy="true" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]"><div className="h-64 animate-pulse rounded-lg border border-border bg-surface-elevated" /><div className="h-64 animate-pulse rounded-lg border border-border bg-surface-elevated" /><span className="sr-only">Loading doctor profile</span></div> : null}
    {!loading && error ? <Card className="mt-0 p-4 sm:p-5"><Notice tone={notFound ? 'warning' : 'error'}>{notFound ? 'This doctor profile is no longer available.' : error}</Notice><Link to="/patient/clinics"><Button variant="secondary">Return to discovery</Button></Link></Card> : null}
    {!loading && !error && profile ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
      <Card className="mt-0 overflow-hidden"><div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:p-5">
        {profile.avatar ? <img src={profile.avatar} alt={`${profile.name} profile`} className="size-24 shrink-0 rounded-lg border border-border object-cover" /> : <div aria-hidden="true" className="grid size-24 shrink-0 place-items-center rounded-lg bg-primary-soft text-2xl font-semibold text-primary-hover">{profile.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('')}</div>}
        <div className="min-w-0"><h2 className="m-0 text-xl font-semibold text-text-primary">{profile.name}</h2><p className="mb-0 mt-1 text-sm text-text-secondary">{profile.professionalTitle ?? 'Verified doctor'}</p>
          {profile.specializations.length ? <div className="mt-3 flex flex-wrap gap-2">{profile.specializations.map((item) => <Badge key={item} tone="pill">{item}</Badge>)}</div> : null}
        </div>
      </div>
      <SectionHeading title="Professional information" />
      <DetailList items={[
        ['Qualifications', profile.qualifications.length ? profile.qualifications.join(', ') : 'Not provided'],
        ['Experience', profile.yearsOfExperience === null ? 'Not provided' : `${profile.yearsOfExperience} years`],
        ['Consultation fee', new Intl.NumberFormat('en-IN', { style: 'currency', currency: profile.currency }).format(profile.consultationFee)],
      ]} />
      <div className="px-4 pb-5 sm:px-5"><h3 className="mb-2 mt-0 text-sm font-semibold text-text-primary">Clinic</h3><Link to={`/patient/clinics/${encodeURIComponent(profile.clinic.listingId)}`} className="font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{profile.clinic.name}</Link>
        <p className="mb-0 mt-1 text-sm text-text-muted">{[profile.clinic.address, profile.clinic.city, profile.clinic.state, profile.clinic.pincode].filter(Boolean).join(', ') || 'Location details unavailable'}</p>
        {profile.clinic.phone ? <a className="mt-2 inline-flex min-h-9 items-center text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={`tel:${profile.clinic.phone}`}>Call clinic: {profile.clinic.phone}</a> : null}
      </div></Card>
      <Card className="mt-0 overflow-hidden"><SectionHeading title="Appointment availability" description="Choose a date to see current available appointment times." />
        <div className="p-4 sm:p-5"><label className="grid max-w-xs gap-2 text-sm font-medium text-text-secondary">Appointment date
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>
          {availabilityError ? <Notice tone="error" className="mt-4">{availabilityError}</Notice> : null}
          {availabilityLoading ? <p role="status" className="mt-4 text-sm text-text-muted">Loading available times…</p> : null}
          {currentAvailability && currentAvailability.slots.length === 0 ? <p className="mt-4 text-sm text-text-muted">No appointment times are currently available for this date.</p> : null}
          {currentAvailability?.slots.length ? <div className="mt-4 flex flex-wrap gap-2">{currentAvailability.slots.map((slot) => <Button key={slot.startAt} type="button" variant="secondary" size="sm" onClick={() => bookSelectedTime(slot.startAt)}>{slot.localStartTime}–{slot.localEndTime}</Button>)}</div> : null}
          {currentAvailability?.slots.length ? <p className="mb-0 mt-3 text-xs leading-relaxed text-text-muted">Selecting a time continues to the existing appointment review and booking flow. Availability is checked again before a hold is created.</p> : null}
      </div>
    </Card></div> : null}
  </>;
}
