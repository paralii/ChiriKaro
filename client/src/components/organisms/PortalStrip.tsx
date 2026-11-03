import { Link } from "react-router-dom";

export function PortalStrip() {
  return (
    <section className="border-t border-[#e9e8ef] py-24 max-md:py-16">
      <div className="mx-auto max-w-175 text-center">
        <span className="text-[11px] font-bold tracking-[2px] text-ck-teal">
          HOW CHIRIKARO WORKS
        </span>

        <h2 className="mt-5 text-[clamp(30px,4vw,44px)] leading-[1.15] font-semibold">
          Two journeys.
          <span className="text-brand"> One destination.</span>
        </h2>

        <p className="mx-auto mt-5 max-w-130 text-sm leading-[1.9] text-[#696d7b]">
          Every dental care journey is different. That's why ChiriKaro provides
          dedicated experiences for patients and dental clinics, while keeping
          everything within one platform.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-6 max-md:grid-cols-1">
        {/* Patient Journey */}
        <article className="group flex flex-col rounded-2xl border border-[#e9e8ef] bg-white p-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_#344b7b12] max-md:p-6">
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-xl bg-brand-soft text-lg font-semibold text-brand">
              01
            </span>

            <span className="rounded-full bg-brand-soft px-3 py-1.5 text-[10px] font-semibold text-brand">
              PATIENT EXPERIENCE
            </span>
          </div>

          <h3 className="mt-7 text-2xl font-semibold">
            Your care, made simpler.
          </h3>

          <p className="mt-3 text-[13px] leading-[1.9] text-[#696d7b]">
            From finding the right dental clinic to keeping your appointments
            organised, your dental care journey starts with a simpler
            experience.
          </p>

          <div className="mt-8 space-y-5">
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
                <span className="text-[11px] font-bold text-ck-teal">
                  {step.number}
                </span>

                <div>
                  <h4 className="text-[13px] font-semibold">{step.title}</h4>

                  <p className="mt-1 text-[11px] leading-[1.8] text-[#858895]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/clinics"
            className="mt-9 inline-flex items-center gap-2 text-[12px] font-semibold text-brand transition group-hover:gap-3"
          >
            Explore Clinics <span aria-hidden="true">→</span>
          </Link>
        </article>

        {/* Clinic Journey */}
        <article className="group flex flex-col rounded-2xl border border-[#e9e8ef] bg-white p-8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_#344b7b12] max-md:p-6">
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-xl bg-[#e5f5ef] text-lg font-semibold text-ck-teal">
              02
            </span>

            <span className="rounded-full bg-[#e5f5ef] px-3 py-1.5 text-[10px] font-semibold text-ck-teal">
              CLINIC EXPERIENCE
            </span>
          </div>

          <h3 className="mt-7 text-2xl font-semibold">
            Your clinic, better organised.
          </h3>

          <p className="mt-3 text-[13px] leading-[1.9] text-[#696d7b]">
            Bring the everyday activities of your dental clinic into one
            organised workspace, helping you coordinate operations more
            conveniently.
          </p>

          <div className="mt-8 space-y-5">
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
                <span className="text-[11px] font-bold text-ck-teal">
                  {step.number}
                </span>

                <div>
                  <h4 className="text-[13px] font-semibold">{step.title}</h4>

                  <p className="mt-1 text-[11px] leading-[1.8] text-[#858895]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            to="/for-clinics"
            className="mt-9 inline-flex items-center gap-2 text-[12px] font-semibold text-ck-teal transition group-hover:gap-3"
          >
            Discover Clinic Software <span aria-hidden="true">→</span>
          </Link>
        </article>
      </div>
    </section>
  );
}
