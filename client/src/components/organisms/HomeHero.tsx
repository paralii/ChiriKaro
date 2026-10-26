import { Link } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Eyebrow } from '@/components/atoms/Eyebrow';
import { TextLink } from '@/components/atoms/TextLink';

export function HomeHero() {
  return (
    <section className="grid min-h-[530px] grid-cols-[1.02fr_0.98fr] items-center gap-[7%] pt-14 pb-[62px] max-[1050px]:gap-[2%] max-md:grid-cols-1 max-md:gap-0 max-md:pt-[50px] max-md:pb-[29px]">
      <div className="max-w-[550px] animate-rise-in max-md:max-w-[600px]">
        <Eyebrow className="flex items-center gap-[9px] text-ck-teal"><span className="size-[7px] rounded-full bg-[#34a29a]" /> Connected dental care</Eyebrow>
        <h1 className="mt-[21px] mb-[17px] max-w-[570px] text-[clamp(40px,5vw,66px)] leading-[1.04] font-semibold max-md:text-[43px] max-[420px]:text-[38px]">
          Better care starts with a <em className="text-brand not-italic">clearer picture.</em>
        </h1>
        <p className="m-0 max-w-[460px] text-base leading-[1.7] text-[#5c6070]">A calmer way for patients and clinics to stay connected, from the first appointment to the next smile.</p>
        <div className="mt-[27px] flex items-center gap-[25px] max-[420px]:gap-3.5">
          <Link to="/register/patient"><Button tabIndex={-1}>Get started <span aria-hidden="true">&#8594;</span></Button></Link>
          <TextLink to="/register/clinic">Register your clinic</TextLink>
        </div>
        <div className="mt-[47px] flex items-center gap-[11px] text-[11px] text-[#777a86] max-md:mt-[26px]"><span className="h-px w-7 bg-[#8792a8]" /> Built for the people behind every healthy smile</div>
      </div>

      <div aria-label="Illustration of a dental clinic appointment card" className="relative isolate grid min-h-[380px] animate-rise-in place-items-center max-md:mt-5 max-md:min-h-[330px]">
        <span className="absolute top-[6%] right-[2%] -z-20 h-[83%] w-[74%] -rotate-[9deg] rounded-[48%_52%_44%_56%] bg-[#e8efff]" />
        <span className="absolute right-[9%] bottom-[4%] -z-10 h-[22%] w-[36%] -rotate-15 rounded-full bg-[#d4e8e4]" />
        <span className="absolute top-[3%] left-[4%] -z-10 h-[90%] w-full opacity-65 [background-image:radial-gradient(#9eadd2_1px,transparent_1px)] [background-size:19px_19px] [mask-image:linear-gradient(135deg,#000,transparent_67%)]" />
        <div className="w-[min(375px,83%)] rotate-2 rounded-xl border border-[#e3e6ef] bg-white px-[27px] pt-6 pb-5 shadow-[0_22px_65px_#344b7b20]">
          <div className="flex items-center justify-between">
            <span className="grid size-[34px] place-items-center rounded-[9px_9px_9px_3px] bg-brand text-[10px] font-bold text-white">CK</span>
            <span className="flex items-center gap-1.5 rounded-[5px] bg-[#e5f5ef] px-[9px] py-1.5 text-[10px] font-semibold text-[#287263]"><i className="size-1.5 rounded-full bg-[#3c9d81]" /> Confirmed</span>
          </div>
          <p className="mt-[25px] mb-2 text-[9px] font-bold text-[#787d8c]">NEXT APPOINTMENT</p>
          <h2 className="m-0 text-[21px] leading-[1.3]">Routine check-up</h2>
          <div className="mt-[23px] flex items-center gap-2.5">
            <span className="grid size-[34px] place-items-center rounded-full bg-[#f4d9ca] text-[10px] font-bold text-[#784b3c]">DR</span>
            <div><strong className="block text-[11px]">Dr. Meera Shah</strong><small className="mt-[3px] block text-[10px] text-muted">General dentistry</small></div>
          </div>
          <div className="mt-[19px] flex gap-[17px] text-[10px] text-[#555b6b]"><span>18 October 2026</span><span>10:30 AM</span></div>
          <div className="mt-[18px] mb-[13px] h-px bg-[#ececf1]" />
          <div className="flex items-center justify-between text-[10px] text-[#53596a]"><span>Greenwood Dental Care</span><span className="grid size-[25px] place-items-center rounded-full border border-[#e5e7ed] text-brand">&#8599;</span></div>
        </div>
        <div className="absolute right-[2%] bottom-0 flex items-center gap-[9px] text-[10px] text-[#6f7583] max-md:right-0 max-md:bottom-0.5 max-[420px]:text-[9px]"><span className="h-px w-[21px] bg-[#6f7583]" /> Care that keeps moving forward</div>
      </div>
    </section>
  );
}