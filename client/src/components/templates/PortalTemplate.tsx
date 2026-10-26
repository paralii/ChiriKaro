import type { ReactNode } from 'react';

export function PortalTemplate({ sidebar, topbar, children }: { sidebar: ReactNode; topbar: ReactNode; children: ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-[248px_minmax(0,1fr)] bg-[#fafbfe] max-[1050px]:grid-cols-[220px_minmax(0,1fr)] max-md:grid-cols-1">
      {sidebar}
      <main className="min-w-0">
        {topbar}
        <div className="mx-auto w-[min(100%,1180px)] p-[34px] max-[1050px]:px-[23px] max-[1050px]:py-[27px] max-md:px-4 max-md:pt-6 max-md:pb-[35px] max-[420px]:px-3">{children}</div>
      </main>
    </div>
  );
}