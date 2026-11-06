import { useEffect } from "react";
import { useAppSelector } from "@/store/hooks";

export function useAuthPersistence() {
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (user) {
      localStorage.setItem(
        "chirikaro-auth",
        JSON.stringify({ user }),
      );
    } else {
      localStorage.removeItem("chirikaro-auth");
    }
  }, [user]);
}