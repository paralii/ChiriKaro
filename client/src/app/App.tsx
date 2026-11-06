import { BrowserRouter } from "react-router-dom";
import AppRouter from "@app/router.tsx";
import { useAuthPersistence } from '@shared/hooks/useAuthPersistence';

export default function App() {
  useAuthPersistence();
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
