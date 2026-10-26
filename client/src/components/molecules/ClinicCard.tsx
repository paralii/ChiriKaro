import type { Clinic } from '@/types';

const arts = [
  { bg: 'bg-[#eaf0ff]', ring: 'border-[#c8d4f1]', text: 'text-brand-deep' },
  { bg: 'bg-[#eaf5f1]', ring: 'border-[#c9e2d8]', text: 'text-ck-teal' },
  { bg: 'bg-[#fff1e9]', ring: 'border-[#eed8ca]', text: 'text-[#943700]' },
];

export function ClinicCard({ clinic, index }: { clinic: Clinic; index: number }) {
  const art = arts[index % arts.length];
  const initials = clinic.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <article className="overflow-hidden rounded-[7px] border border-[#e5e6ed] bg-white">
      <div className={`relative grid h-28 place-items-center overflow-hidden ${art.bg}`}>
        <i className={`absolute -top-[83px] -left-[18px] size-[130px] rounded-full border ${art.ring}`} />
        <i className={`absolute -right-[39px] -bottom-[99px] size-[175px] rounded-full border ${art.ring}`} />
        <span className={`z-10 grid size-[47px] place-items-center rounded-[14px_14px_14px_4px] border border-[#d9e0f2] bg-white text-xs font-bold ${art.text}`}>{initials}</span>
      </div>
      <div className="p-[13px]">
        <span className="text-[8px] font-bold text-[#7c8290]">GENERAL DENTISTRY</span>
        <h3 className="mt-[7px] mb-[5px] text-xs">{clinic.name}</h3>
        <p className="m-0 min-h-4 text-[10px] text-[#777d8a]">{clinic.address}</p>
        <div className="mt-[13px] flex items-center justify-between gap-2 border-t border-[#eff0f4] pt-2.5 text-[9px] text-[#5c6270]">
          <span>{clinic.phone}</span>
          <button aria-label={`Contact ${clinic.name}`} title="Contact clinic" className="grid size-6 cursor-pointer place-items-center rounded-full border border-[#dce2f1] bg-white text-brand-deep">&#8599;</button>
        </div>
      </div>
    </article>
  );
}