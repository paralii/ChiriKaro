import { Link } from "react-router-dom";
import { BrandLockup } from "@/components/atoms/BrandLockup";

export function PublicNav() {
  return (
    <header className="flex h-19.5 items-center justify-between border-b border-[#e9e8ef] max-md:h-16.5">
      <BrandLockup />

      <nav className="flex items-center gap-8 max-md:gap-5">
        {" "}
        <Link
          to="/clinics"
          className="text-[12px] font-medium text-[#626777] transition hover:text-brand max-[420px]:hidden"
        >
          {" "}
          Find Care{" "}
        </Link>{" "}
        <Link
          to="/for-clinics"
          className="text-[12px] font-medium text-[#626777] transition hover:text-brand"
        >
          {" "}
          For Clinics{" "}
        </Link>
      </nav>
    </header>
  );
}
