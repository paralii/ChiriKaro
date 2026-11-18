import { TextField } from '@/components/molecules/FormField';
import { SectionHeading } from '@/components/molecules/SectionHeading';

export function ProfileForm({ name, email, roleLabel }: { name: string; email: string; roleLabel: string }) {
  return (
    <>
      <SectionHeading title="Personal information" description="Account details associated with your signed-in profile." />
      <div className="grid max-w-[520px] gap-3 p-[18px]">
        <TextField label="Full name" value={name} readOnly />
        <TextField label="Email address" value={email} readOnly />
        <TextField label="Account type" value={roleLabel} readOnly />
      </div>
    </>
  );
}
