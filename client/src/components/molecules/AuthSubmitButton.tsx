import type { ReactNode } from 'react';
import { Button } from '@/components/atoms/Button';

export function AuthSubmitButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <Button className="mt-[3px] w-full" disabled={busy}>
      {busy ? 'Please wait...' : children}
      <span aria-hidden="true" className="ml-auto text-[17px] font-normal">&#8594;</span>
    </Button>
  );
}