import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import type { RootState, AppDispatch } from './store/store';
import { setAuthSession, setUser } from './store/slices/authSlice';
import AuthPage from './pages/auth/LoginPage';
import LoginPage from './pages/auth/login/LoginPage';
import RegistrationPage from './pages/auth/registration/RegistrationPage';
import ForgotPasswordPage from './pages/auth/forgot-password/ForgotPasswordPage';
import HomePage from './pages/HomePage';
import PortalPage from './pages/PortalPage';
import { apiRequest } from './lib/api';

function AppRoutes() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, accessToken, refreshToken } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (user) {
      window.localStorage.setItem('chirikaro-auth', JSON.stringify({ user, accessToken, refreshToken }));
    } else {
      window.localStorage.removeItem('chirikaro-auth');
    }
  }, [user, accessToken, refreshToken]);

  const defaultPortal = user ? '/app/dashboard' : '/login/patient';

  const handleLogout = async () => {
    if (accessToken) {
      try {
        await apiRequest('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        }, accessToken);
      } catch {
        // Ignore backend logout failures and still clear the local session.
      }
    }

    dispatch(setUser(null));
    dispatch(setAuthSession(null));
  };

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<Navigate to="/login/patient" replace />} />
      <Route path="/superadmin" element={<AuthPage />} />
      <Route path="/login/super-admin" element={<Navigate to="/superadmin" replace />} />
      <Route path="/register/doctor" element={<Navigate to="/login/doctor" replace />} />
      <Route path="/register/staff" element={<Navigate to="/login/staff" replace />} />
      <Route path="/register/super-admin" element={<Navigate to="/superadmin" replace />} />
      <Route path="/login/:role" element={<LoginPage />} />
      <Route path="/register/:role" element={<RegistrationPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ForgotPasswordPage />} />
      <Route path="/accept-invitation" element={<AuthPage />} />
      <Route path="/app" element={<Navigate to={defaultPortal} replace />} />
      <Route path="/app/:section" element={user ? <PortalPage onLogout={handleLogout} /> : <Navigate to="/login/patient" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return <BrowserRouter><AppRoutes /></BrowserRouter>;
}