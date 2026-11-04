import { useNavigate } from "react-router-dom";
import { useAction } from "@shared/hooks/useAction";
import { useAppDispatch } from "@store/hooks";
import {
  setAuthSession,
  setUser,
} from "@store/slices/authSlice";
import { authService } from "@services/authService";
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
        
        dispatch(
          setUser(result.user),
        );
        dispatch(
          setAuthSession({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
          }),
        );
        navigate("/app/dashboard", { replace: true });
      },
      { fallback: "We could not complete that request. Please try again." },
    );

  return { login, busy, error };
}
