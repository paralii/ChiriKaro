import { Link } from "react-router-dom";
import { Button } from "@components/atoms/Button";
import { Eyebrow } from "@components/atoms/Eyebrow";

export function HomeHero() {
  return (
    <section className="grid min-h-136 grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] items-center gap-10 py-14 lg:gap-14 lg:py-20 max-md:grid-cols-1 max-md:gap-0 max-md:py-12">
      <div className="max-w-2xl animate-rise-in">
        <Eyebrow className="flex items-center gap-2 text-secondary">
          <span className="size-2 rounded-full bg-secondary" />A connected
          dental care platform
        </Eyebrow>

        <h1 className="mt-5 mb-4 max-w-3xl text-[clamp(2.5rem,5vw,4.25rem)] leading-tight font-semibold tracking-tight text-text-primary">
          Dental care,
          <br />
          <em className="text-brand not-italic">better connected.</em>
        </h1>

        <p className="m-0 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
          Discover dental clinics, manage appointments and bring everyday clinic
          operations together through one connected platform.
        </p>

        <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Link to="/login/patient">
            <Button tabIndex={-1}>
              Explore Clinics <span aria-hidden="true">&#8594;</span>
            </Button>
          </Link>

          <Link
            to="/login/clinic"
            className="inline-flex min-h-11 items-center justify-center rounded-ui border border-border-strong bg-surface-elevated px-5 text-sm font-semibold text-text-secondary transition-[color,background-color,border-color] duration-interactive hover:border-primary hover:bg-primary-soft hover:text-primary-hover active:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            For Clinics
          </Link>
        </div>

        <div className="mt-10 flex items-center gap-3 text-sm text-text-muted max-md:mt-7">
          <span className="h-px w-7 bg-border-strong" />
          One platform. Two connected experiences.
        </div>
      </div>

      <div
        aria-label="Illustration showing patient appointment and clinic management"
        className="relative isolate grid min-h-96 animate-rise-in place-items-center max-md:mt-8 max-md:min-h-88 sm:min-h-112"
      >
        <span className="absolute top-[6%] right-[2%] -z-20 h-[83%] w-[74%] rotate-[9deg] rounded-[48%_52%_44%_56%] bg-[#e8efff]" />

        <span className="absolute right-[9%] bottom-[4%] -z-10 h-[22%] w-[36%] -rotate-15 rounded-full bg-[#d4e8e4]" />

        <span className="absolute top-[3%] left-[4%] -z-10 h-[90%] w-full opacity-65 bg-[radial-gradient(#9eadd2_1px,transparent_1px)] [bg-size:19px_19px] mask-[linear-gradient(135deg,#000,transparent_67%)]" />

        {/* Patient appointment card */}
        <div className="relative z-10 w-[min(375px,83%)] rotate-2 rounded-xl border border-border bg-surface-elevated px-6 pt-6 pb-5 shadow-lg">
          <div className="flex items-center justify-between">
            <img
              src="/favicon.svg"
              alt="ChiriKaro"
              className="size-5 rounded-[10px_10px_10px_3px] object-contain"
            />

            <span className="flex items-center gap-1.5 rounded-sm bg-success-soft px-2.5 py-1.5 text-xs font-semibold text-success">
              <i className="size-1.5 rounded-full bg-success" />
              Confirmed
            </span>
          </div>

          <p className="mt-6 mb-2 text-xs font-semibold tracking-wide text-text-muted">
            NEXT APPOINTMENT
          </p>

          <h2 className="m-0 text-xl leading-tight font-semibold text-text-primary">Routine check-up</h2>

          <div className="mt-5.75 flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-accent/10 text-xs font-bold text-accent">
              DR
            </span>

            <div>
              <strong className="block text-sm font-semibold text-text-primary">Dr. Meera Shah</strong>

              <small className="mt-1 block text-xs text-text-muted">
                General dentistry
              </small>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary">
            <span>18 October 2026</span>
            <span>10:30 AM</span>
          </div>

          <div className="my-4 h-px bg-border" />

          <div className="flex items-center justify-between gap-3 text-xs text-text-secondary">
            <span>Greenwood Dental Care</span>

            <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-full border border-border text-primary">
              &#8599;
            </span>
          </div>
        </div>

        {/* Clinic management card */}
        <div className="absolute right-[-1%] bottom-[8%] z-20 w-44 rounded-lg border border-border bg-surface-elevated p-4 shadow-md max-[420px]:right-[-2%] max-[420px]:w-36">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold tracking-wide text-text-muted">
              CLINIC OVERVIEW
            </span>

            <span className="size-2 rounded-full bg-secondary" />
          </div>

          <div className="mt-4 flex items-end justify-between">
            <div>
              <strong className="block text-2xl leading-none font-semibold text-primary">
                24
              </strong>

              <span className="mt-1 block text-xs text-text-muted">
                Appointments
              </span>
            </div>

            <span className="rounded-md bg-success-soft px-2 py-1 text-xs font-semibold text-success">
              Today
            </span>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-page">
            <div className="h-full w-[72%] rounded-full bg-secondary" />
          </div>

          <p className="mt-2 text-[9px] text-[#858895]">
            Your clinic, organised.
          </p>
        </div>

        <div className="absolute top-[2%] right-[2%] flex items-center gap-2 text-xs text-text-muted max-md:hidden">
          <span className="h-px w-5.25 bg-[#6f7583]" />
          Care that keeps moving forward
        </div>
      </div>
    </section>
  );
}
