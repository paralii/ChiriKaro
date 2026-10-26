import { ClinicCard } from '@/components/molecules/ClinicCard';
import type { Clinic } from '@/types';

export function ClinicCards({ clinics }: { clinics: Clinic[] }) {
  return (
    <div className="grid grid-cols-3 gap-[13px] p-4 max-md:grid-cols-2 max-md:[&>:last-child:nth-child(odd)]:col-span-full max-[420px]:grid-cols-1 max-[420px]:[&>:last-child:nth-child(odd)]:col-auto">
      {clinics.map((c, i) => <ClinicCard key={c.id} clinic={c} index={i} />)}
    </div>
  );
}