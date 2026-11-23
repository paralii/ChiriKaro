import type { ReactNode } from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Card } from '@/components/atoms/Card';
import type { PublicDirectoryListing } from '@/shared/types';

type DirectoryListingCardProps = {
  listing: PublicDirectoryListing;
  children: ReactNode;
};

export function DirectoryListingCard({ listing, children }: DirectoryListingCardProps) {
  const address = [listing.address, listing.city, listing.state, listing.pincode].filter(Boolean).join(', ');

  return (
    <Card className="m-0 min-w-0 overflow-hidden p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge tone="approved">Verified clinic</Badge>
          <h3 className="mt-2 mb-0 break-words text-lg font-semibold text-text-primary">{listing.clinicName}</h3>
          <p className="mt-1 mb-0 text-sm leading-relaxed text-text-muted">{address || 'Location details unavailable'}</p>
        </div>
        <div className="shrink-0 rounded-md bg-primary-soft px-3 py-2 sm:text-right">
          <span className="block text-xs text-text-muted">Consultation fee</span>
          <strong className="text-sm font-semibold text-text-primary">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: listing.currency }).format(listing.consultationFee)}</strong>
        </div>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="m-0 text-sm font-semibold text-text-primary">
          {listing.professionalTitle ? `${listing.professionalTitle} ` : ''}{listing.doctorName}
        </p>
        {listing.specializations.length ? <div className="mt-2 flex flex-wrap gap-1.5" aria-label="Specializations">
          {listing.specializations.map((specialization) => <Badge key={specialization} tone="pill">{specialization}</Badge>)}
        </div> : <p className="mb-0 mt-2 text-sm text-text-muted">No specializations listed</p>}
        {listing.phone ? <a className="mt-3 inline-flex min-h-9 items-center rounded-sm text-sm font-semibold text-primary-hover underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" href={`tel:${listing.phone}`}>Contact clinic: {listing.phone}</a> : null}
      </div>
      <div className="mt-4 border-t border-border pt-4">{children}</div>
    </Card>
  );
}

export function DirectoryListingSkeleton() {
  return <div aria-hidden="true" className="rounded-lg border border-border bg-surface-elevated p-4 shadow-sm sm:p-5">
    <div className="animate-pulse">
      <div className="h-5 w-28 rounded bg-page" />
      <div className="mt-3 h-6 w-3/5 rounded bg-page" />
      <div className="mt-2 h-4 w-4/5 rounded bg-page" />
      <div className="mt-5 border-t border-border pt-4">
        <div className="h-4 w-2/5 rounded bg-page" />
        <div className="mt-3 flex gap-2"><div className="h-6 w-20 rounded bg-page" /><div className="h-6 w-24 rounded bg-page" /></div>
        <div className="mt-5 h-10 w-36 rounded bg-page" />
      </div>
    </div>
    <span className="sr-only">Loading clinic and doctor listings</span>
  </div>;
}
