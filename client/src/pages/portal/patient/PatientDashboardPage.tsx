import { Card } from '@/components/atoms/Card';
import { TextLink } from '@/components/atoms/TextLink';
import { MetricCard, MetricGrid } from '@/components/molecules/MetricCard';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { WelcomeBand } from '@/components/molecules/WelcomeBand';
import { ClinicCards } from '@/components/organisms/ClinicCard';
import { featuredClinics } from '@/constants/sampleClinics';
import { useAppSelector } from '@/store/hooks';

export default function PatientDashboardPage() {
  const user = useAppSelector((s) => s.auth.user)!;
  return (
    <>
      <WelcomeBand variant="patient" eyebrow="YOUR CARE, IN ONE PLACE" title={`Good to see you, ${user.name.split(' ')[0]}.`} description="Your next step toward a healthier smile starts here."
        action={<span className="grid size-14 place-items-center rounded-[17px_17px_17px_5px] border border-[#cfd9f2] bg-white text-[15px] font-bold text-brand">CK</span>} />
      <MetricGrid cols={2}>
        <MetricCard label="Care profile" value="Ready" note="Your account is active" to="/app/profile" linkText="View profile" />
        <MetricCard label="Nearby clinics" value="03" note="Featured clinics in Bengaluru" to="/app/clinics" linkText="Explore clinics" />
      </MetricGrid>
      <Card>
        <SectionHeading title="Clinics to know" description="Featured practices near you" action={<TextLink to="/app/clinics">See all <span>&#8594;</span></TextLink>} />
        <ClinicCards clinics={featuredClinics.slice(0, 3)} />
      </Card>
    </>
  );
}