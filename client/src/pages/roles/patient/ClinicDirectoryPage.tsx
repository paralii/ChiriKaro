import type { ManagedClinic } from '../super-admin/ClinicManagementPage';

export function ClinicDirectoryPage({ clinics, renderCards }: { clinics: ManagedClinic[]; renderCards: (clinics: ManagedClinic[]) => React.ReactNode }) {
  return (
    <section className="content-section">
      <div className="section-heading"><div><h2>Featured clinics</h2><p>Explore dental practices in Bengaluru</p></div><span className="subtle-label">SAMPLE DIRECTORY</span></div>
      {renderCards(clinics)}
    </section>
  );
}
