import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandLockup } from '@/components/atoms/BrandLockup';
import { Eyebrow } from '@/components/atoms/Eyebrow';

export function AuthTemplate({
  kicker,
  title,
  intro,
  children,
  actionText,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: ReactNode;
  actionText?: ReactNode;
}) {
  return (
    <main className="grid min-h-screen grid-cols-[minmax(330px,0.82fr)_1.18fr] bg-white max-md:grid-cols-1">
      <div className="relative flex min-h-screen flex-col justify-between overflow-hidden bg-[#eef3ff] px-[8%] py-8 max-md:hidden">
        <i className="absolute -right-32.5 bottom-[13%] size-92.5 rounded-full border border-[#cad7f2]" />
        <i className="absolute -right-11.25 bottom-[20%] size-57.5 rounded-full border border-[#cad7f2]" />

        <BrandLockup />

        <div className="relative z-10 my-auto max-w-[400px] py-[60px]">
          <Eyebrow className="text-brand-deep">CARE, CONNECTED</Eyebrow>

          <h1 className="my-[13px] max-w-[360px] text-4xl leading-[1.18]">
            A little more clarity for every smile.
          </h1>

          <p className="max-w-[320px] text-sm leading-[1.7] text-[#5f6678]">
            Thoughtful tools for the people who make dental care happen.
          </p>
        </div>

        <div className="relative z-10 flex justify-between gap-5 text-[10px] text-[#777e90]">
          <span>Designed around trust.</span>
          <span>
            ChiriKaro <i className="px-0.75 not-italic">/</i> 2026
          </span>
        </div>
      </div>

      <section className="flex min-h-screen flex-col px-[7%] py-[30px] max-md:px-[22px] max-md:py-5 max-[420px]:px-[17px]">
        <div className="hidden max-md:block">
          <BrandLockup />
        </div>

        <div className="m-auto w-[min(100%,420px)] animate-rise-in py-8 max-md:w-[min(100%,450px)] max-md:py-7">
          <Link
            to="/"
            className="mb-[31px] inline-block text-xs text-[#777d8b] hover:text-brand-deep max-md:mb-[25px]"
          >
            &#8592; Back to home
          </Link>

          <Eyebrow className="text-brand-deep">{kicker}</Eyebrow>

          <h2 className="mt-2.5 mb-2 text-[29px] leading-[1.2]">
            {title}
          </h2>

          <p className="mb-6 text-[13px] leading-[1.65] text-[#686d7b]">
            {intro}
          </p>

          {children}

          {actionText && (
            <p className="mt-5 text-center text-xs text-[#717584] [&_a]:font-semibold [&_a]:text-brand-deep [&_a:hover]:underline">
              {actionText}
            </p>
          )}
        </div>

        <footer className="flex justify-between gap-3 border-t border-[#eeedf3] pt-4 text-[10px] text-[#888b96] max-md:text-[9px] max-[420px]:flex-col max-[420px]:gap-1.5">
          <span>Private by design</span>
          <span>Need help? Contact your clinic</span>
        </footer>
      </section>
    </main>
  );
}