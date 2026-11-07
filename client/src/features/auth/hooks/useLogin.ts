import { useNavigate } from "react-router-dom";
import { useAction } from "@shared/hooks/useAction";
import { useAppDispatch } from "@store/hooks";
import {
  setUser,
} from "@/features/auth/store/authSlice";
import { authService } from "@/features/auth/services/authService";
import { normalizeEmail, validateEmail } from "@shared/utils/validators";

export function useLogin() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { busy, error, run } = useAction();

  const login = (email: string, password: string) =>
    run(
      async () => {
        if (!validateEmail(email))
          throw new Error("Enter a valid email address.");
        if (!password) throw new Error("Password is required.");

        const result = await authService.login({
          email: normalizeEmail(email),
          password,
        });

        if (!result.data) throw new Error('The signed-in user was not returned.');
        dispatch(setUser(result.data));

        const destination = {
          SUPER_ADMIN: '/app/dashboard',
          CLINIC_ADMIN: '/clinic/dashboard',
          DOCTOR: '/doctor/dashboard',
          STAFF: '/staff/dashboard',
          PATIENT: '/patient/dashboard',
        }[result.data.role];
        navigate(destination, { replace: true });
      },
      { fallback: "We could not complete that request. Please try again." },
    );

  return { login, busy, error };
}
