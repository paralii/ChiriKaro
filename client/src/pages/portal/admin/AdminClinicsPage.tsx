import { Card } from '@/components/atoms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicTable } from '@/components/organisms/ClinicTable';
import { useAdminClinics } from '@/hooks/useAdminClinics';

export default function AdminClinicsPage({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const { items, busy, error, message, changeStatus } = useAdminClinics();
  const list = pendingOnly ? items.filter((c) => c.status === 'PENDING') : items;
  return (
    <>
      <Notices error={error} message={message} />
      <Card>
        <SectionHeading title={pendingOnly ? 'Applications awaiting review' : 'Clinic directory'} description={`${list.length} clinic${list.length === 1 ? '' : 's'} found`} action={<Badge>UPDATED JUST NOW</Badge>} />
        <ClinicTable clinics={list} onStatus={changeStatus} busy={busy} />
      </Card>
    </>
  );
}