import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@store/hooks";
import type { Role } from "@/features/auth/store/authSlice";

export function RequireAuth() {
  const user = useAppSelector((s) => s.auth.user);
  return user ? <Outlet /> : <Navigate to="/login/patient" replace />;
}

export function RequireRole({ roles }: { roles: Role[] }) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) {
    return <Navigate to="/login/patient" replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to="/app/dashboard" replace />;
  }
  return <Outlet />;
}

export function RequireSuperAdmin() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/superadmin" replace />;
  if (user.role === "SUPER_ADMIN") return <Outlet />;
  if (user.role === "CLINIC_ADMIN") return <Navigate to="/clinic/dashboard" replace />;
  return <Navigate to="/" replace />;
}

export function RequireClinicAdmin() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login/clinic" replace />;
  if (user.role === "CLINIC_ADMIN") return <Outlet />;
  if (user.role === "SUPER_ADMIN") return <Navigate to="/app/dashboard" replace />;
  return <Navigate to="/" replace />;
}

export function RequireDoctor() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login/doctor" replace />;
  return user.role === "DOCTOR" ? <Outlet /> : <Navigate to="/" replace />;
}

export function RequireStaff() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login/staff" replace />;
  return user.role === "STAFF" ? <Outlet /> : <Navigate to="/" replace />;
}

export function RequirePatient() {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login/patient" replace />;
  return user.role === "PATIENT" ? <Outlet /> : <Navigate to="/" replace />;
}
