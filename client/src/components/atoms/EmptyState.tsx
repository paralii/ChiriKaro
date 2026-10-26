import type { ReactNode } from 'react';

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-[18px] py-8 text-center text-xs text-[#858997]">{children}</div>;
}