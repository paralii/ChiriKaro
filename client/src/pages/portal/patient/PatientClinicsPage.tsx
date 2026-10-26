import { Badge } from '@/components/atoms/Badge';
import { Card } from '@/components/atoms/Card';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { ClinicCards } from '@/components/organisms/ClinicCard';
import { featuredClinics } from '@/constants/sampleClinics';

export default function PatientClinicsPage() {
  return (
    <Card>
      <SectionHeading title="Featured clinics" description="Explore dental practices in Bengaluru" action={<Badge>SAMPLE DIRECTORY</Badge>} />
      <ClinicCards clinics={featuredClinics} />
    </Card>
  );
}