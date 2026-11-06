import { PublicNav } from "@/components/organisms/PublicNav";
import { HomeHero } from "@/components/organisms/HomeHero";
import { PortalStrip } from "@/components/organisms/PortalStrip";
import { Link } from "react-router-dom";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-surface px-[6.4%] max-[1050px]:px-[4%] max-md:px-5 max-[420px]:px-4">
      <PublicNav />

      {/* 01 - Introduction */}
      <HomeHero />

      {/* 02 - The Problem */}
      <section className="border-t border-[#e9e8ef] py-24 max-md:py-16">
        <div className="mx-auto max-w-175 text-center">
          <span className="text-[11px] font-bold tracking-[2px] text-ck-teal">
            THE NEED FOR CONNECTION
          </span>

          <h2 className="mt-5 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold">
            Dental care should feel
            <span className="text-brand"> simpler.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-135 text-sm leading-[1.9] text-[#696d7b]">
            Finding the right dental clinic, keeping track of appointments, and
            managing everyday clinic activities can feel disconnected. Patients
            need a simpler way to access care, while clinics need better ways to
            organise it.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <article className="rounded-2xl border border-[#e9e8ef] bg-white p-8 max-md:p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-brand-soft text-lg text-brand">
              01
            </span>

            <h3 className="mt-6 text-xl font-semibold">For patients</h3>

            <p className="mt-3 text-[13px] leading-[1.9] text-[#696d7b]">
              Discovering clinics and managing dental appointments should be
              straightforward, without unnecessary complications.
            </p>
          </article>

          <article className="rounded-2xl border border-[#e9e8ef] bg-white p-8 max-md:p-6">
            <span className="grid size-11 place-items-center rounded-xl bg-[#e5f5ef] text-lg text-ck-teal">
              02
            </span>

            <h3 className="mt-6 text-xl font-semibold">For dental clinics</h3>

            <p className="mt-3 text-[13px] leading-[1.9] text-[#696d7b]">
              Coordinating appointments, patients, doctors and everyday
              operations deserves a more organised approach.
            </p>
          </article>
        </div>
      </section>

      {/* 03 - The Solution */}
      <section className="relative overflow-hidden rounded-2xl bg-[#f0f3ff] px-10 py-20 max-md:px-6 max-md:py-14">
        <div className="mx-auto max-w-175 text-center">
          <span className="text-[11px] font-bold tracking-[2px] text-ck-teal">
            INTRODUCING CHIRIKARO
          </span>

          <h2 className="mt-5 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold">
            Two experiences.
            <br />
            <span className="text-brand">One connected platform.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-130 text-sm leading-[1.9] text-[#696d7b]">
            ChiriKaro brings patients and dental clinics into one connected
            ecosystem, making dental care discovery and clinic management more
            convenient and organised.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <span className="rounded-full border border-brand/15 bg-white px-5 py-2.5 text-[12px] font-semibold text-brand">
              Patient Experience
            </span>

            <span className="rounded-full border border-ck-teal/20 bg-white px-5 py-2.5 text-[12px] font-semibold text-ck-teal">
              Clinic Management
            </span>
          </div>
        </div>
      </section>

      {/* 04 - How it works */}
      <PortalStrip />

      {/* 05 - Why ChiriKaro */}
      <section className="border-t border-[#e9e8ef] py-24 max-md:py-16">
        <div className="mx-auto max-w-175 text-center">
          <span className="text-[11px] font-bold tracking-[2px] text-ck-teal">
            WHY CHIRIKARO
          </span>

          <h2 className="mt-5 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold">
            Designed around
            <span className="text-brand"> better care.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-130 text-sm leading-[1.9] text-[#696d7b]">
            More than just a way to find clinics, ChiriKaro brings the everyday
            dental care experience into one organised platform.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-3 gap-6 max-md:grid-cols-1">
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
              className="rounded-xl border border-[#e9e8ef] bg-white p-7 transition duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_#344b7b0d]"
            >
              <span className="text-[11px] font-bold tracking-widest text-ck-teal">
                {item.number}
              </span>

              <h3 className="mt-5 text-[17px] font-semibold">{item.title}</h3>

              <p className="mt-3 text-[13px] leading-[1.9] text-[#696d7b]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* 06 - Final CTA */}
      <section className="relative overflow-hidden rounded-2xl bg-brand px-10 py-20 text-center text-white max-md:px-6 max-md:py-14">
        <span className="absolute -top-20 -right-16 size-64 rounded-full bg-white/5" />
        <span className="absolute -bottom-32 -left-16 size-72 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-160">
          <span className="text-[10px] font-bold tracking-[2px] text-white/70">
            YOUR NEXT STEP
          </span>

          <h2 className="mt-5 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold">
            Better dental care starts with a connection.
          </h2>

          <p className="mx-auto mt-5 max-w-120 text-sm leading-[1.9] text-white/75">
            Whether you're looking for a dental clinic or managing one, there's
            a place for you at ChiriKaro.
          </p>

          <div className="mt-9 flex justify-center gap-4 max-[480px]:flex-col">
            <Link
              to="/register/patient"
              className="rounded-lg bg-white px-7 py-3.5 text-[12px] font-semibold text-brand transition hover:bg-[#edf1ff]"
            >
              Get Started as Patient →
            </Link>

            <Link
              to="/register/clinic"
              className="rounded-lg border border-white/40 px-7 py-3.5 text-[12px] font-semibold text-white transition hover:bg-white/10"
            >
              Join as a Clinic →
            </Link>
          </div>
        </div>
      </section>

      {/* 07 - Footer */}
      <footer className="mt-20 border-t border-[#e5e4ec] pt-12 pb-6">
        <div className="grid grid-cols-[1.5fr_1fr_1fr] gap-8 max-md:grid-cols-2 max-[420px]:grid-cols-1">
          <div>
            <h3 className="text-xl font-bold tracking-tight text-brand">
              ChiriKaro
            </h3>

            <p className="mt-3 max-w-62.5 text-[12px] leading-[1.8] text-[#858895]">
              Connected dental care for patients and clinics.
            </p>
          </div>

          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-[#555b6b]">
              PATIENTS
            </h4>

            <div className="mt-4 flex flex-col gap-3 text-[12px] text-[#858895]">

              <Link to="/login/patient" className="transition hover:text-brand">
                Patient Login
              </Link>

              <Link
                to="/register/patient"
                className="transition hover:text-brand"
              >
                Get Started
              </Link>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold tracking-wider text-[#555b6b]">
              CLINICS
            </h4>

            <div className="mt-4 flex flex-col gap-3 text-[12px] text-[#858895]">

              <Link to="/login/clinic" className="transition hover:text-brand">
                Clinic Login
              </Link>

              <Link
                to="/register/clinic"
                className="transition hover:text-brand"
              >
                Join ChiriKaro
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex justify-between border-t border-[#e9e8ef] pt-5 text-[10px] text-[#858895]">
          <span>
            ChiriKaro <span className="px-1 text-[#b1b3bc]">/</span> 2026
          </span>

          <span>Connected dental care.</span>
        </div>
      </footer>
    </main>
  );
}
