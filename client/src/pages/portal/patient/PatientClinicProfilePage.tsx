import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Notice } from '@/components/atoms/Notice';
import { DetailList } from '@/components/molecules/DetailList';
import { EmptyState } from '@/components/molecules/EmptyState';
import { PageHeading } from '@/components/molecules/PageHeading';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { publicDirectoryService } from '@/features/patient/services/publicDirectoryService';
import { getErrorMessage } from '@/shared/lib/http';
import type { PublicClinicProfile } from '@/shared/types';

export default function PatientClinicProfilePage() {
  const { listingId = '' } = useParams();
  const [profile, setProfile] = useState<PublicClinicProfile | null>(null);
  const [loadedListingId, setLoadedListingId] = useState('');
  const [profileError, setProfileError] = useState<{ listingId: string; message: string; notFound: boolean } | null>(null);
  const loading = loadedListingId !== listingId;
  const error = profileError?.listingId === listingId ? profileError.message : '';
  const notFound = profileError?.listingId === listingId && profileError.notFound;

  useEffect(() => {
    let active = true;
    void publicDirectoryService.clinicProfile(listingId).then((result) => {
      if (active) { setProfile(result); setProfileError(null); }
    }).catch((reason: unknown) => {
      if (!active) return;
      setProfileError({ listingId, notFound: axios.isAxiosError(reason) && reason.response?.status === 404, message: getErrorMessage(reason, 'Could not load this clinic profile.') });
    }).finally(() => { if (active) setLoadedListingId(listingId); });
    return () => { active = false; };
  }, [listingId]);

  return <>
    <div className="mb-5"><Link to="/patient/clinics" className="text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">← Back to discovery</Link></div>
    <PageHeading eyebrow="CLINIC PROFILE" title={loading ? 'Loading clinic…' : profile?.name ?? 'Clinic profile'} chip={profile?.clinicType ?? undefined} />
    {loading ? <div aria-busy="true" className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]"><div className="h-56 animate-pulse rounded-lg border border-border bg-surface-elevated" /><div className="h-56 animate-pulse rounded-lg border border-border bg-surface-elevated" /><span className="sr-only">Loading clinic profile</span></div> : null}
    {!loading && error ? <Card className="p-4 sm:p-5"><Notice tone={notFound ? 'warning' : 'error'}>{notFound ? 'This clinic profile is no longer available.' : error}</Notice><Link to="/patient/clinics"><Button variant="secondary">Return to discovery</Button></Link></Card> : null}
    {!loading && !error && profile ? <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
      <Card className="mt-0 overflow-hidden"><SectionHeading title="About this clinic" description={profile.description || 'Clinic description has not been provided.'} />
        <DetailList items={[
          ['Address', [profile.address, profile.city, profile.state, profile.pincode].filter(Boolean).join(', ') || 'Not provided'],
          ['Phone', profile.phone ?? 'Not provided'],
          ['Clinic type', profile.clinicType ?? 'Not provided'],
        ]} />
        <div className="px-4 pb-5 sm:px-5"><h2 className="mb-2 mt-0 text-sm font-semibold text-text-primary">Specializations</h2>
          {profile.specializations.length ? <div className="flex flex-wrap gap-2">{profile.specializations.map((item) => <Badge key={item} tone="pill">{item}</Badge>)}</div> : <p className="m-0 text-sm text-text-muted">No clinic specializations listed.</p>}
        </div>
      </Card>
      <Card className="mt-0 overflow-hidden"><SectionHeading title="Available doctors" description="Choose a verified doctor to view appointment availability and booking options." />
        {profile.doctors.length ? <div className="grid gap-3 p-4 sm:p-5">{profile.doctors.map((doctor) => <article key={doctor.listingId} className="rounded-lg border border-border bg-surface p-4">
          <h3 className="m-0 text-base font-semibold text-text-primary"><Link to={`/patient/doctors/${encodeURIComponent(doctor.listingId)}`} className="text-inherit underline-offset-4 hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">{doctor.professionalTitle ? `${doctor.professionalTitle} ` : ''}{doctor.doctorName}</Link></h3>
          <p className="mb-0 mt-2 text-sm font-medium text-text-secondary">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: doctor.currency }).format(doctor.consultationFee)}</p>
          {doctor.specializations.length ? <div className="mt-2 flex flex-wrap gap-1.5">{doctor.specializations.map((item) => <Badge key={item} tone="pill">{item}</Badge>)}</div> : null}
          <Link to={`/patient/doctors/${encodeURIComponent(doctor.listingId)}`} className="mt-3 inline-flex"><Button size="sm">View availability and book</Button></Link>
        </article>)}</div> : <EmptyState><p className="m-0">No bookable verified doctors are currently listed for this clinic.</p></EmptyState>}
      </Card>
    </div> : null}
  </>;
}
