import type { ReactNode } from 'react';

export type ManagedClinic = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  ownerName?: string;
  contactEmail?: string;
  status: string;
  isActive: boolean;
};

export function ClinicManagementPage({
  clinics,
  section,
  busy,
  onStatus,
  renderTable,
}: {
  clinics: ManagedClinic[];
  section: 'clinics' | 'pending';
  busy: boolean;
  onStatus: (id: string, status: string) => void;
  renderTable: (items: ManagedClinic[], busy: boolean, onStatus: (id: string, status: string) => void) => ReactNode;
}) {
  const clinicItems = clinics.filter((clinic) => section !== 'pending' || clinic.status === 'PENDING');
  return (
    <section className="content-section">
      <div className="section-heading"><div><h2>{section === 'pending' ? 'Applications awaiting review' : 'Clinic directory'}</h2><p>{clinicItems.length} clinic{clinicItems.length === 1 ? '' : 's'} found</p></div><span className="subtle-label">UPDATED JUST NOW</span></div>
      {renderTable(clinicItems, busy, onStatus)}
    </section>
  );
}
