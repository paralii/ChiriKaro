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
    <main className="grid min-h-screen grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)] bg-surface-elevated lg:grid-cols-[minmax(360px,0.82fr)_minmax(0,1.18fr)] max-md:grid-cols-1">
      <div className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-primary-soft px-[8%] py-8 md:flex">
        <i aria-hidden="true" className="absolute -right-32.5 bottom-[13%] size-92.5 rounded-full border border-primary/15" />
        <i aria-hidden="true" className="absolute -right-11.25 bottom-[20%] size-57.5 rounded-full border border-primary/15" />

        <BrandLockup />

        <div className="relative z-10 my-auto max-w-md py-14 lg:py-16">
          <Eyebrow className="text-primary-hover">CARE, CONNECTED</Eyebrow>

          <h1 className="my-4 max-w-sm text-3xl leading-tight font-semibold tracking-tight text-text-primary lg:text-4xl">
            A little more clarity for every smile.
          </h1>

          <p className="max-w-sm text-base leading-relaxed text-text-secondary">
            Thoughtful tools for the people who make dental care happen.
          </p>
        </div>

        <div className="relative z-10 flex justify-between gap-5 text-xs text-text-muted">
          <span>Designed around trust.</span>
          <span>
            ChiriKaro <i className="px-0.75 not-italic">/</i> 2026
          </span>
        </div>
      </div>

      <section className="flex min-h-screen flex-col px-5 py-5 sm:px-8 sm:py-7 lg:px-[8%] lg:py-8">
        <div className="mb-8 md:hidden">
          <BrandLockup />
        </div>

        <div className="m-auto w-full max-w-md animate-rise-in py-6 sm:py-8">
          <Link
            to="/"
            className="mb-7 inline-flex min-h-9 items-center rounded-sm text-sm text-text-muted underline-offset-4 transition-colors duration-interactive hover:text-primary-hover hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:mb-8"
          >
            &#8592; Back to home
          </Link>

          <Eyebrow className="text-primary-hover">{kicker}</Eyebrow>

          <h2 className="mt-2 mb-2 text-2xl leading-tight font-semibold tracking-tight text-text-primary sm:text-3xl">
            {title}
          </h2>

          <p className="mb-6 text-sm leading-relaxed text-text-secondary sm:text-base">
            {intro}
          </p>

          {children}

          {actionText && (
            <p className="mt-5 text-center text-sm text-text-muted [&_a]:font-semibold [&_a]:text-primary-hover [&_a:hover]:underline [&_a:focus-visible]:outline-focus">
              {actionText}
            </p>
          )}
        </div>

        <footer className="flex flex-col justify-between gap-1.5 border-t border-border pt-4 text-xs text-text-muted sm:flex-row sm:gap-3">
          <span>Private by design</span>
          <span>Need help? Contact your clinic</span>
        </footer>
      </section>
    </main>
  );
}
