import { Link } from "react-router-dom";
import { Button } from "@components/atoms/Button";
import { Eyebrow } from "@components/atoms/Eyebrow";

export function HomeHero() {
  return (
    <section className="grid min-h-132.5 grid-cols-[1.02fr_0.98fr] items-center gap-[7%] pt-14 pb-20 max-[1050px]:gap-[2%] max-md:grid-cols-1 max-md:gap-0 max-md:pt-12.5 max-md:pb-12">
      <div className="max-w-137.5 animate-rise-in max-md:max-w-150">
        <Eyebrow className="flex items-center gap-2.25 text-ck-teal">
          <span className="size-1.72 rounded-full bg-[#34a29a]" />A connected
          dental care platform
        </Eyebrow>

        <h1 className="mt-5.25 mb-4.25 max-w-142.5 text-[clamp(40px,5vw,66px)] leading-[1.04] font-semibold max-md:text-[43px] max-[420px]:text-[38px]">
          Dental care,
          <br />
          <em className="text-brand not-italic">better connected.</em>
        </h1>

        <p className="m-0 max-w-115 text-base leading-[1.8] text-[#5c6070]">
          Discover dental clinics, manage appointments and bring everyday clinic
          operations together through one connected platform.
        </p>

        <div className="mt-7 flex items-center gap-3.5 max-[420px]:flex-col max-[420px]:items-start">
          <Link to="/login/patient">
            <Button tabIndex={-1}>
              Explore Clinics <span aria-hidden="true">&#8594;</span>
            </Button>
          </Link>

          <Link
            to="/login/clinic"
            className="rounded-lg border border-[#e2e3eb] bg-white px-5 py-3 text-[12px] font-semibold text-[#555b6b] transition hover:border-brand hover:text-brand"
          >
            For Clinics
          </Link>
        </div>

        <div className="mt-11.5 flex items-center gap-2.75 text-[11px] text-[#777a86] max-md:mt-7">
          <span className="h-px w-7 bg-[#8792a8]" />
          One platform. Two connected experiences.
        </div>
      </div>

      <div
        aria-label="Illustration showing patient appointment and clinic management"
        className="relative isolate grid min-h-95 animate-rise-in place-items-center max-md:mt-8 max-md:min-h-87.5"
      >
        <span className="absolute top-[6%] right-[2%] -z-20 h-[83%] w-[74%] rotate-[9deg] rounded-[48%_52%_44%_56%] bg-[#e8efff]" />

        <span className="absolute right-[9%] bottom-[4%] -z-10 h-[22%] w-[36%] -rotate-15 rounded-full bg-[#d4e8e4]" />

        <span className="absolute top-[3%] left-[4%] -z-10 h-[90%] w-full opacity-65 bg-[radial-gradient(#9eadd2_1px,transparent_1px)] [bg-size:19px_19px] mask-[linear-gradient(135deg,#000,transparent_67%)]" />

        {/* Patient appointment card */}
        <div className="relative z-10 w-[min(375px,83%)] rotate-2 rounded-xl border border-[#e3e6ef] bg-white px-6.75 pt-6 pb-5 shadow-[0_22px_65px_#344b7b20]">
          <div className="flex items-center justify-between">
            <img
              src="/favicon.svg"
              alt="ChiriKaro"
              className="size-5 rounded-[10px_10px_10px_3px] object-contain"
            />

            <span className="flex items-center gap-1.5 rounded-[5px] bg-[#e5f5ef] px-2.25 py-1.5 text-[10px] font-semibold text-[#287263]">
              <i className="size-1.5 rounded-full bg-[#3c9d81]" />
              Confirmed
            </span>
          </div>

          <p className="mt-6.25 mb-2 text-[9px] font-bold text-[#787d8c]">
            NEXT APPOINTMENT
          </p>

          <h2 className="m-0 text-[21px] leading-[1.3]">Routine check-up</h2>

          <div className="mt-5.75 flex items-center gap-2.5">
            <span className="grid size-8.5 place-items-center rounded-full bg-[#f4d9ca] text-[10px] font-bold text-[#784b3c]">
              DR
            </span>

            <div>
              <strong className="block text-[11px]">Dr. Meera Shah</strong>

              <small className="mt-0.75 block text-[10px] text-muted">
                General dentistry
              </small>
            </div>
          </div>

          <div className="mt-4.25 flex gap-4.25 text-[10px] text-[#555b6b]">
            <span>18 October 2026</span>
            <span>10:30 AM</span>
          </div>

          <div className="mt-4.5 mb-3.25 h-px bg-[#ececf1]" />

          <div className="flex items-center justify-between text-[10px] text-[#53596a]">
            <span>Greenwood Dental Care</span>

            <span className="grid size-6.25 place-items-center rounded-full border border-[#e5e7ed] text-brand">
              &#8599;
            </span>
          </div>
        </div>

        {/* Clinic management card */}
        <div className="absolute right-[-1%] bottom-[8%] z-20 w-45 rounded-lg border border-[#e6e8ef] bg-white p-4 shadow-[0_12px_35px_#344b7b18] max-[420px]:right-[-2%] max-[420px]:w-38.75">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-bold tracking-wider text-[#858895]">
              CLINIC OVERVIEW
            </span>

            <span className="size-2 rounded-full bg-[#34a29a]" />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <strong className="block text-[24px] leading-none text-brand">
                24
              </strong>

              <span className="mt-1 block text-[9px] text-[#858895]">
                Appointments
              </span>
            </div>

            <span className="rounded-md bg-[#e5f5ef] px-2 py-1 text-[9px] font-semibold text-[#287263]">
              Today
            </span>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#edf0f5]">
            <div className="h-full w-[72%] rounded-full bg-ck-teal" />
          </div>

          <p className="mt-2 text-[9px] text-[#858895]">
            Your clinic, organised.
          </p>
        </div>

        <div className="absolute top-[2%] right-[2%] flex items-center gap-2.25 text-[10px] text-[#6f7583] max-md:hidden">
          <span className="h-px w-5.25 bg-[#6f7583]" />
          Care that keeps moving forward
        </div>
      </div>
    </section>
  );
}
