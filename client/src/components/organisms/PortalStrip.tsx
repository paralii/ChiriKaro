import { Link } from "react-router-dom";

export function PortalStrip() {
  return (
    <section className="border-t border-border py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-175 text-center">
        <span className="text-xs font-semibold tracking-[0.14em] text-secondary">
          HOW CHIRIKARO WORKS
        </span>

        <h2 className="mt-4 text-[clamp(1.875rem,4vw,2.75rem)] leading-tight font-semibold tracking-tight text-text-primary sm:mt-5">
          Two journeys.
          <span className="text-primary"> One destination.</span>
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-text-secondary sm:mt-5 sm:text-base">
          Every dental care journey is different. That's why ChiriKaro provides
          dedicated experiences for patients and dental clinics, while keeping
          everything within one platform.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-12 sm:gap-6 lg:grid-cols-2">
        {/* Patient Journey */}
        <article className="group flex flex-col rounded-xl border border-border bg-surface-elevated p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-interactive hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-7 lg:p-8">
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-xl bg-primary-soft text-lg font-semibold text-primary">
              01
            </span>

            <span className="rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary-hover">
              PATIENT EXPERIENCE
            </span>
          </div>

          <h3 className="mt-6 text-xl leading-tight font-semibold text-text-primary sm:text-2xl">
            Your care, made simpler.
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            From finding the right dental clinic to keeping your appointments
            organised, your dental care journey starts with a simpler
            experience.
          </p>

          <div className="mt-7 space-y-5">
            {[
              {
                number: "01",
                title: "Discover clinics",
                description:
                  "Explore dental clinics and find the right place for your care.",
              },
              {
                number: "02",
                title: "Book appointments",
                description:
                  "Schedule your visits through a convenient platform.",
              },
              {
                number: "03",
                title: "Stay connected",
                description: "Keep your dental care journey organised.",
              },
            ].map((step) => (
              <div key={step.number} className="flex gap-4">
                <span className="text-xs font-bold text-secondary">
                  {step.number}
                </span>

                <div>
                  <h4 className="text-sm font-semibold text-text-primary">{step.title}</h4>

                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/register/patient"
            className="mt-8 inline-flex min-h-10 items-center gap-2 self-start rounded-sm text-sm font-semibold text-primary-hover underline-offset-4 transition-[color,gap] duration-interactive hover:gap-3 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Explore Clinics <span aria-hidden="true">→</span>
          </Link>
        </article>

        {/* Clinic Journey */}
        <article className="group flex flex-col rounded-xl border border-border bg-surface-elevated p-5 shadow-sm transition-[transform,box-shadow,border-color] duration-interactive hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-md sm:p-7 lg:p-8">
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-xl bg-success-soft text-lg font-semibold text-success">
              02
            </span>

            <span className="rounded-full bg-success-soft px-3 py-1.5 text-xs font-semibold text-success">
              CLINIC EXPERIENCE
            </span>
          </div>

          <h3 className="mt-6 text-xl leading-tight font-semibold text-text-primary sm:text-2xl">
            Your clinic, better organised.
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-text-secondary">
            Bring the everyday activities of your dental clinic into one
            organised workspace, helping you coordinate operations more
            conveniently.
          </p>

          <div className="mt-7 space-y-5">
            {[
              {
                number: "01",
                title: "Set up your clinic",
                description:
                  "Bring your clinic presence into the ChiriKaro platform.",
              },
              {
                number: "02",
                title: "Manage appointments",
                description:
                  "Keep track of appointments and patient interactions.",
              },
              {
                number: "03",
                title: "Organise operations",
                description:
                  "Manage doctors, patients and everyday clinic activities.",
              },
            ].map((step) => (
              <div key={step.number} className="flex gap-4">
                <span className="text-xs font-bold text-secondary">
                  {step.number}
                </span>

                <div>
                  <h4 className="text-sm font-semibold text-text-primary">{step.title}</h4>

                  <p className="mt-1 text-sm leading-relaxed text-text-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/register/clinics"
            className="mt-8 inline-flex min-h-10 items-center gap-2 self-start rounded-sm text-sm font-semibold text-success underline-offset-4 transition-[color,gap] duration-interactive hover:gap-3 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            Discover Clinic Software <span aria-hidden="true">→</span>
          </Link>
        </article>
      </div>
    </section>
  );
}
