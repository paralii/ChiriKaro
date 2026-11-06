import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@store/hooks";
import type { Role } from "@store/slices/authSlice";

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
