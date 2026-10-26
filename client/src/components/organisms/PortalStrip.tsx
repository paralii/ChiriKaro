import { Link } from 'react-router-dom';
import { Eyebrow } from '@/components/atoms/Eyebrow';
import { cn } from '@/lib/cn';

const portals = [
  { title: 'Patient', description: 'Your dental care, in one place', href: '/login/patient', action: 'Patient login', color: 'text-brand' },
  { title: 'Clinic', description: 'Manage your practice and team', href: '/login/clinic', action: 'Clinic login', color: 'text-ck-teal' },
];

export function PortalStrip() {
  return (
    <section aria-label="Choose your portal" className="grid grid-cols-[0.75fr_1.75fr] gap-10 border-t border-[#e5e4ec] pt-7 pb-[43px] max-md:grid-cols-1 max-md:gap-3 max-md:py-6">
      <div><Eyebrow className="text-brand-deep">One platform, every perspective</Eyebrow><h2 className="mt-[9px] mb-2 text-xl max-md:mb-4">Choose your workspace</h2></div>
      <div className="grid grid-cols-2 max-md:grid-cols-1">
        {portals.map((p, i) => (
          <article key={p.title} className="grid min-h-[90px] animate-rise-in grid-cols-[30px_1fr_27px] items-center gap-3 border-l border-[#e5e4ec] px-[17px] max-md:min-h-[74px] max-md:border-t max-md:border-l-0 max-md:px-[5px]">
            <span className={cn('text-[11px] font-bold', p.color)}>0{i + 1}</span>
            <div><h3 className="mb-[5px] text-sm">{p.title}</h3><p className="m-0 text-[11px] leading-normal text-muted">{p.description}</p></div>
            <Link to={p.href} aria-label={p.action} className="grid size-[26px] place-items-center rounded-full border border-[#d9dfef] text-brand transition hover:bg-brand hover:text-white">&#8594;</Link>
          </article>
        ))}
      </div>
    </section>
  );
}