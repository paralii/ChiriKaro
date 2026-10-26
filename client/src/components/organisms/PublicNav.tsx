import { Link } from 'react-router-dom';
import { BrandLockup } from '@/components/atoms/BrandLockup';
import { Button } from '@/components/atoms/Button';

export function PublicNav() {
  return (
    <header className="flex h-[78px] items-center justify-between border-b border-[#e9e8ef] max-md:h-[66px]">
      <BrandLockup />
      <nav aria-label="Account navigation" className="flex items-center gap-7 text-[13px] font-semibold text-muted max-md:gap-3.5">
        <Link to="/login/patient" className="hover:text-brand-deep">Sign in</Link>
        <Link to="/register/patient"><Button size="sm" className="max-md:min-h-[35px] max-md:px-2.5 max-md:text-[10px]" tabIndex={-1}>Create patient account</Button></Link>
      </nav>
    </header>
  );
}