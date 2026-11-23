import type { ReactNode } from 'react';

export function PortalTemplate({ sidebar, topbar, children }: { sidebar: ReactNode; topbar: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[minmax(220px,248px)_minmax(0,1fr)] bg-page max-md:grid-cols-1">
      {sidebar}
      <main className="min-h-screen min-w-0 bg-page max-md:min-h-0">
        {topbar}
        <div className="mx-auto w-full max-w-310 px-4 py-6 sm:px-6 sm:py-7 lg:px-8 lg:py-8 xl:px-10">{children}</div>
      </main>
    </div>
  );
}
