import { Link } from "react-router-dom";
import { BrandLockup } from "@/components/atoms/BrandLockup";

export function PublicNav() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border sm:h-18">
      <BrandLockup />

      <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-6">
        <Link
          to="/login/patient"
          className="hidden min-h-10 items-center rounded-sm px-2 text-sm font-medium text-text-secondary transition-colors duration-interactive hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:inline-flex"
        >
          Find Care
        </Link>{" "}
        <Link
          to="/login/clinic"
          className="inline-flex min-h-10 items-center justify-center rounded-ui border border-transparent bg-primary px-3.5 text-sm font-semibold text-white transition-colors duration-interactive hover:bg-primary-hover active:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:px-4"
        >
          For Clinics
        </Link>
      </nav>
    </header>
  );
}
