import { PublicNav } from "@/components/organisms/PublicNav";
import { HomeHero } from "@/components/organisms/HomeHero";
import { PortalStrip } from "@/components/organisms/PortalStrip";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-[1600px] overflow-hidden bg-surface px-4 sm:px-6 lg:px-10 xl:px-14">
      <PublicNav />

      {/* 01 - Introduction */}
      <HomeHero />

      {/* 02 - The Problem */}
      <section className="border-t border-border py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold tracking-[0.14em] text-secondary">
            THE NEED FOR CONNECTION
          </span>

          <h2 className="mt-4 text-[clamp(1.875rem,4vw,2.75rem)] leading-tight font-semibold tracking-tight text-text-primary sm:mt-5">
            Dental care should feel
            <span className="text-primary"> simpler.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-text-secondary sm:mt-5 sm:text-base">
            Finding the right dental clinic, keeping track of appointments, and
            managing everyday clinic activities can feel disconnected. Patients
            need a simpler way to access care, while clinics need better ways to
            organise it.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6">
          <article className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm sm:p-7 lg:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-primary-soft text-lg text-primary">
              01
            </span>

            <h3 className="mt-5 text-xl font-semibold text-text-primary">For patients</h3>

            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Discovering clinics and managing dental appointments should be
              straightforward, without unnecessary complications.
            </p>
          </article>

          <article className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm sm:p-7 lg:p-8">
            <span className="grid size-11 place-items-center rounded-xl bg-success-soft text-lg text-success">
              02
            </span>

            <h3 className="mt-5 text-xl font-semibold text-text-primary">For dental clinics</h3>

            <p className="mt-3 text-sm leading-relaxed text-text-secondary">
              Coordinating appointments, patients, doctors and everyday
              operations deserves a more organised approach.
            </p>
          </article>
        </div>
      </section>

      {/* 03 - The Solution */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-primary-soft px-5 py-14 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold tracking-[0.14em] text-secondary">
            INTRODUCING CHIRIKARO
          </span>

          <h2 className="mt-4 text-[clamp(1.875rem,4vw,2.75rem)] leading-tight font-semibold tracking-tight text-text-primary sm:mt-5">
            Two experiences.
            <br />
            <span className="text-primary">One connected platform.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:mt-5 sm:text-base">
            ChiriKaro brings patients and dental clinics into one connected
            ecosystem, making dental care discovery and clinic management more
            convenient and organised.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <span className="rounded-full border border-primary/15 bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-primary-hover sm:px-5">
              Patient Experience
            </span>

            <span className="rounded-full border border-secondary/20 bg-surface-elevated px-4 py-2.5 text-sm font-semibold text-secondary sm:px-5">
              Clinic Management
            </span>
          </div>
        </div>
      </section>

      {/* 04 - How it works */}
      <PortalStrip />

      {/* 05 - Why ChiriKaro */}
      <section className="border-t border-border py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-semibold tracking-[0.14em] text-secondary">
            WHY CHIRIKARO
          </span>

          <h2 className="mt-4 text-[clamp(1.875rem,4vw,2.75rem)] leading-tight font-semibold tracking-tight text-text-primary sm:mt-5">
            Designed around
            <span className="text-primary"> better care.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:mt-5 sm:text-base">
            More than just a way to find clinics, ChiriKaro brings the everyday
            dental care experience into one organised platform.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3">
          {[
            {
              number: "01",
              title: "Connected experiences",
              description:
                "Patients and clinics get dedicated experiences within one connected ecosystem.",
            },
            {
              number: "02",
              title: "Simpler appointments",
              description:
                "Make discovering dental clinics and managing appointments more convenient.",
            },
            {
              number: "03",
              title: "Organised operations",
              description:
                "Bring patients, appointments, doctors and everyday clinic activities together.",
            },
          ].map((item) => (
            <article
              key={item.number}
              className="rounded-xl border border-border bg-surface-elevated p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-interactive hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-7"
            >
              <span className="text-xs font-semibold tracking-widest text-secondary">
                {item.number}
              </span>

              <h3 className="mt-4 text-lg font-semibold text-text-primary">{item.title}</h3>

              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* 06 - Final CTA */}
      <section className="relative overflow-hidden rounded-2xl bg-primary px-5 py-14 text-center text-white sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <span className="absolute -top-20 -right-16 size-64 rounded-full bg-white/5" />
        <span className="absolute -bottom-32 -left-16 size-72 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-160">
          <span className="text-xs font-semibold tracking-[0.14em] text-white/80">
            YOUR NEXT STEP
          </span>

          <h2 className="mt-4 text-[clamp(1.875rem,4vw,2.75rem)] leading-tight font-semibold tracking-tight sm:mt-5">
            Better dental care starts with a connection.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/85 sm:mt-5 sm:text-base">
            Whether you're looking for a dental clinic or managing one, there's
            a place for you at ChiriKaro.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row sm:gap-4">
            <Link
              to="/register/patient"
              className="inline-flex min-h-11 items-center justify-center rounded-ui bg-white px-6 text-sm font-semibold text-primary-hover transition-colors duration-interactive hover:bg-primary-soft active:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-7"
            >
              Get Started as Patient →
            </Link>

            <Link
              to="/register/clinic"
              className="inline-flex min-h-11 items-center justify-center rounded-ui border border-white/50 px-6 text-sm font-semibold text-white transition-colors duration-interactive hover:bg-white/10 active:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:px-7"
            >
              Join as a Clinic →
            </Link>
          </div>
        </div>
      </section>

      {/* 07 - Footer */}
      <footer className="mt-16 border-t border-border pt-10 pb-6 sm:mt-20 sm:pt-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-primary">
              ChiriKaro
            </h3>

            <p className="mt-3 max-w-64 text-sm leading-relaxed text-text-muted">
              Connected dental care for patients and clinics.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-wider text-text-primary">
              PATIENTS
            </h4>

            <div className="mt-4 flex flex-col items-start gap-3 text-sm text-text-muted">

              <Link to="/login/patient" className="rounded-sm transition-colors duration-interactive hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                Patient Login
              </Link>

              <Link
                to="/register/patient"
                className="rounded-sm transition-colors duration-interactive hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-wider text-text-primary">
              CLINICS
            </h4>

            <div className="mt-4 flex flex-col items-start gap-3 text-sm text-text-muted">

              <Link to="/login/clinic" className="rounded-sm transition-colors duration-interactive hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">
                Clinic Login
              </Link>

              <Link
                to="/register/clinic"
                className="rounded-sm transition-colors duration-interactive hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Join ChiriKaro
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-border pt-5 text-xs text-text-muted sm:flex-row sm:gap-4">
          <span>
            ChiriKaro <span className="px-1 text-border-strong">/</span> 2026
          </span>

          <span>Connected dental care.</span>
        </div>
      </footer>
    </main>
  );
}
