import { useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store/store';
import { normalizeRole, setAuthSession, setUser } from '../../store/slices/authSlice';
import { apiRequest } from '../../lib/api';
import { OtpInput } from '../../components/auth/OtpInput';

type AuthResult = {
  user: { id: string; name: string; email: string; role: string; clinicId?: string | null; status?: string };
  accessToken: string;
  refreshToken: string;
};

const displayRoles: Record<string, string> = { patient: 'Patient', clinic: 'Clinic', 'super-admin': 'Super admin', doctor: 'Doctor', staff: 'Staff' };
const loginRole: Record<string, string> = { patient: 'PATIENT', clinic: 'CLINIC_ADMIN', doctor: 'DOCTOR', staff: 'STAFF', 'super-admin': 'SUPER_ADMIN' };
type AuthRouteMode = 'login' | 'registration' | 'forgot-password';

function AuthShell({
  kicker,
  title,
  intro,
  children,
  actionText,
}: {
  kicker: string;
  title: string;
  intro: string;
  children: React.ReactNode;
  actionText?: React.ReactNode;
}) {
  return (
    <main className="auth-page">
      <div className="auth-aside">
        <Link className="brand-lockup" to="/"><span className="brand-mark">C</span><span>ChiriKaro</span></Link>
        <div className="auth-aside-copy">
          <span className="auth-aside-mark">CK</span>
          <p className="eyebrow">CARE, CONNECTED</p>
          <h1>A little more clarity for every smile.</h1>
          <p>Thoughtful tools for the people who make dental care happen.</p>
        </div>
        <div className="auth-aside-foot"><span>Designed around trust.</span><span>ChiriKaro <i>/</i> 2026</span></div>
      </div>
      <section className="auth-main">
        <div className="auth-mobile-brand"><Link className="brand-lockup" to="/"><span className="brand-mark">C</span><span>ChiriKaro</span></Link></div>
        <div className="auth-form-wrap">
          <Link className="back-link" to="/">&#8592; Back to home</Link>
          <p className="eyebrow auth-kicker">{kicker}</p>
          <h2>{title}</h2>
          <p className="auth-intro">{intro}</p>
          {children}
          {actionText ? <p className="auth-switch">{actionText}</p> : null}
        </div>
        <footer className="auth-footer"><span>Private by design</span><span>Need help? Contact your clinic</span></footer>
      </section>
    </main>
  );
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(value: string) {
  return emailPattern.test(value.trim());
}

function PatientAuthView({ role = 'patient', mode }: { role?: 'patient' | 'doctor' | 'staff'; mode?: AuthRouteMode }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpRequestedEmail, setOtpRequestedEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { pathname } = useLocation();
  const isSignup = mode ? mode === 'registration' : pathname.startsWith('/register');

  async function requestOtp() {
    if (name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long.');
    }
    if (!validateEmail(email)) {
      throw new Error('Enter a valid email address before requesting a verification code.');
    }
    if (password.length < 8) {
      throw new Error('Choose a password with at least 8 characters before requesting a code.');
    }

    await apiRequest('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'register' }),
    });

    setOtpRequestedEmail(email.trim().toLowerCase());
    setNotice('A 6-digit verification code has been sent to your email.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');

    try {
      if (isSignup) {
        if (!name.trim() || name.trim().length < 2) throw new Error('Name must be at least 2 characters long.');
        if (!validateEmail(email)) throw new Error('A valid email address is required.');
        if (password.length < 8) throw new Error('Choose a password with at least 8 characters.');
        if (!otpStep) {
          if (otpRequestedEmail !== email.trim().toLowerCase()) await requestOtp();
          setOtpStep(true);
          return;
        }
        if (!/^\d{6}$/.test(otpCode.trim())) throw new Error('Enter the 6-digit code sent to your email.');

        const result = await apiRequest<AuthResult>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, otp: otpCode.trim() }),
        });

        dispatch(setUser({ ...result.user, role: normalizeRole(result.user.role) }));
        dispatch(setAuthSession({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
        navigate('/app/dashboard', { replace: true });
        return;
      }

      if (!validateEmail(email)) throw new Error('Enter a valid email address.');
      if (!password) throw new Error('Password is required.');

      const result = await apiRequest<AuthResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: loginRole[role] }),
      });

      dispatch(setUser({ ...result.user, role: normalizeRole(result.user.role) }));
      dispatch(setAuthSession({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      navigate('/app/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not complete that request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      kicker={isSignup ? 'PATIENT ACCOUNT' : 'SECURE ACCESS'}
      title={isSignup ? (otpStep ? 'Verify your email' : 'Create your account') : `Sign in as ${displayRoles[role].toLowerCase()}`}
      intro={isSignup ? (otpStep ? 'Enter the 6-digit code we sent to finish creating your account.' : 'Keep your dental care details close at hand.') : role === 'patient' ? 'Use your patient account to continue.' : `Use the ${displayRoles[role].toLowerCase()} account linked to your clinic invitation.`}
      actionText={isSignup ? <><span>Already have an account?</span> <Link to="/login/patient">Sign in</Link></> : role === 'patient' ? <><span>Need a patient account?</span> <Link to="/register/patient">Create one</Link></> : <span>Team accounts are created through a clinic invitation.</span>}
    >
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      {notice ? <div className="notice notice-success" role="status">{notice}</div> : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup && !otpStep ? <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" minLength={2} required /></label> : null}
        {(!isSignup || !otpStep) ? <label>Email address<input value={email} onChange={(event) => { setEmail(event.target.value); setOtpCode(''); }} type="email" placeholder="you@example.com" autoComplete="email" required /></label> : <p className="auth-intro">Verification code sent to <strong>{email}</strong></p>}
        {isSignup && otpStep ? (
          <OtpInput
            email={email}
            value={otpCode}
            onChange={setOtpCode}
            onRequest={requestOtp}
            disabled={busy}
            onRequestError={setError}
            initiallySent
            initialCooldown={60}
          />
        ) : null}
        {(!isSignup || !otpStep) ? <label>
          Password
          <span className="password-field">
            <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={8} required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </span>
        </label> : null}
        {!isSignup ? <div className="auth-options"><label className="remember-option"><input type="checkbox" /> <span>Remember me</span></label><Link to="/forgot-password">Forgot password?</Link></div> : null}
        {isSignup && otpStep ? <button type="button" className="text-link" onClick={() => { setOtpStep(false); setError(''); }}>Edit registration details</button> : null}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait...' : isSignup ? (otpStep ? 'Verify and create account' : 'Continue to email verification') : 'Sign in'}<span aria-hidden="true">&#8594;</span></button>
      </form>
    </AuthShell>
  );
}

function ClinicAuthView({ mode }: { mode?: AuthRouteMode }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpRequestedEmail, setOtpRequestedEmail] = useState('');
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { pathname } = useLocation();
  const isSignup = mode ? mode === 'registration' : pathname.startsWith('/register');
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  async function requestOtp() {
    if (clinicName.trim().length < 2) {
      throw new Error('Clinic name must be at least 2 characters long.');
    }
    if (name.trim().length < 2) {
      throw new Error('Owner name must be at least 2 characters long.');
    }
    if (!validateEmail(email)) {
      throw new Error('A valid owner email is required.');
    }
    if (password.length < 8) {
      throw new Error('Choose a password with at least 8 characters before requesting a code.');
    }

    await apiRequest('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'register' }),
    });

    setOtpRequestedEmail(email.trim().toLowerCase());
    setNotice('A 6-digit verification code has been sent to your email.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');

    try {
      if (isSignup) {
        if (!clinicName.trim()) throw new Error('Clinic name is required.');
        if (!name.trim() || name.trim().length < 2) throw new Error('Owner name must be at least 2 characters long.');
        if (!validateEmail(email)) throw new Error('A valid owner email is required.');
        if (password.length < 8) throw new Error('Choose a password with at least 8 characters.');
        if (!otpStep) {
          if (otpRequestedEmail !== email.trim().toLowerCase()) await requestOtp();
          setOtpStep(true);
          return;
        }
        if (!/^\d{6}$/.test(otpCode.trim())) throw new Error('Enter the 6-digit code sent to your email.');

        await apiRequest('/clinics/register', {
          method: 'POST',
          body: JSON.stringify({
            name: clinicName.trim(),
            ownerName: name.trim(),
            email: email.trim().toLowerCase(),
            password,
            otp: otpCode.trim(),
            phone: phone.trim(),
            address: address.trim(),
          }),
        });

        setNotice('Your clinic application has been submitted and is pending approval.');
        setApplicationSubmitted(true);
        setOtpCode('');
        setPassword('');
        return;
      }

      if (!validateEmail(email)) throw new Error('Enter a valid email address.');
      if (!password) throw new Error('Password is required.');

      const result = await apiRequest<AuthResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: loginRole.clinic }),
      });

      dispatch(setUser({ ...result.user, role: normalizeRole(result.user.role) }));
      dispatch(setAuthSession({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      navigate('/app/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not complete that request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      kicker={isSignup ? 'CLINIC ONBOARDING' : 'SECURE ACCESS'}
      title={isSignup ? (otpStep ? 'Verify your email' : 'Register your clinic') : 'Sign in as clinic'}
      intro={isSignup ? (otpStep ? 'Enter the 6-digit code we sent to submit your application.' : 'Share a few details to request access for your practice.') : 'Use your clinic account to continue.'}
      actionText={isSignup ? <><span>Already have a clinic account?</span> <Link to="/login/clinic">Sign in</Link></> : <><span>Need to register your clinic?</span> <Link to="/register/clinic">Start onboarding</Link></>}
    >
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      {notice ? <div className="notice notice-success" role="status">{notice}</div> : null}

      {!applicationSubmitted ? <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup && !otpStep ? <label>Clinic name<input value={clinicName} onChange={(event) => setClinicName(event.target.value)} placeholder="Greenwood Dental Care" autoComplete="organization" required /></label> : null}
        {isSignup && !otpStep ? <label>Owner name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" minLength={2} required /></label> : null}
        {(!isSignup || !otpStep) ? <label>Email address<input value={email} onChange={(event) => { setEmail(event.target.value); setOtpCode(''); }} type="email" placeholder="owner@clinic.com" autoComplete="email" required /></label> : <p className="auth-intro">Verification code sent to <strong>{email}</strong></p>}
        {isSignup && !otpStep ? <><label>Phone number<input value={phone} onChange={(event) => setPhone(event.target.value)} type="tel" placeholder="+91 80 1234 5678" /></label><label>Clinic address<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Area, city" /></label></> : null}
        {isSignup && otpStep ? (
          <OtpInput
            email={email}
            value={otpCode}
            onChange={setOtpCode}
            onRequest={requestOtp}
            disabled={busy}
            onRequestError={setError}
            initiallySent
            initialCooldown={60}
          />
        ) : null}
        {(!isSignup || !otpStep) ? <label>
          Password
          <span className="password-field">
            <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={8} required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </span>
        </label> : null}
        {isSignup && otpStep ? <button type="button" className="text-link" onClick={() => { setOtpStep(false); setError(''); }}>Edit clinic details</button> : null}
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait...' : isSignup ? (otpStep ? 'Verify and submit application' : 'Continue to email verification') : 'Sign in'}<span aria-hidden="true">&#8594;</span></button>
      </form> : <div className="notice-action"><Link to="/login/clinic">Continue to sign in &#8594;</Link></div>}
    </AuthShell>
  );
}

function SuperAdminAuthView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError('');
    try {
      if (!validateEmail(email)) throw new Error('Enter a valid email address.');
      if (!password) throw new Error('Password is required.');

      const result = await apiRequest<AuthResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, role: loginRole['super-admin'] }),
      });

      dispatch(setUser({ ...result.user, role: normalizeRole(result.user.role) }));
      dispatch(setAuthSession({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      navigate('/app/dashboard', { replace: true });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not complete that request. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      kicker="SUPER ADMIN"
      title="Sign in as super admin"
      intro="Use your administrator credentials to review clinics and manage workspace access."
      actionText={<><span>Back to patient access?</span> <Link to="/login/patient">Patient login</Link></>}
    >
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="admin@chirikaro.com" autoComplete="email" required /></label>
        <label>
          Password
          <span className="password-field">
            <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="Enter your password" autoComplete="current-password" required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </span>
        </label>
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait...' : 'Sign in'}<span aria-hidden="true">&#8594;</span></button>
      </form>
    </AuthShell>
  );
}

function PasswordRecoveryView() {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  async function requestOtp() {
    if (!validateEmail(email)) {
      throw new Error('A valid email address is required.');
    }

    await apiRequest('/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase(), purpose: 'password-reset' }),
    });

    setNotice('A 6-digit verification code has been sent to your email.');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');

    try {
      if (!validateEmail(email)) throw new Error('A valid email address is required.');
      if (!otpCode.trim()) {
        await requestOtp();
        return;
      }
      if (password.length < 8) throw new Error('Choose a password with at least 8 characters.');
      if (password !== confirmPassword) throw new Error('The new password and confirmation do not match.');

      await apiRequest('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otpCode.trim(), password }),
      });

      setNotice('Your password was reset successfully. You can sign in now.');
      setPassword('');
      setConfirmPassword('');
      setOtpCode('');
      setTimeout(() => navigate('/login/patient', { replace: true }), 900);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not reset your password. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      kicker="PASSWORD RECOVERY"
      title="Reset your password"
      intro="Enter your account email, verify the code, and choose a new password."
      actionText={<><span>Return to sign in?</span> <Link to="/login/patient">Back to login</Link></>}
    >
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      {notice ? <div className="notice notice-success" role="status">{notice}</div> : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="you@example.com" autoComplete="email" required /></label>
        <OtpInput
          email={email}
          value={otpCode}
          onChange={setOtpCode}
          onRequest={requestOtp}
          disabled={busy}
          onRequestError={setError}
        />
        <label>
          New password
          <span className="password-field">
            <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </span>
        </label>
        <label>Confirm password<input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" placeholder="Enter your password again" autoComplete="new-password" minLength={8} required /></label>
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait...' : 'Reset password'}<span aria-hidden="true">&#8594;</span></button>
      </form>
    </AuthShell>
  );
}

function InvitationAcceptanceView() {
  const [searchParams] = useSearchParams();
  const [invitation, setInvitation] = useState<{ email: string; role: string } | null>(null);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const invitationError = token ? '' : 'This invitation link is missing its token. Ask the clinic to send a new invitation.';

  useEffect(() => {
    if (!token) return;

    apiRequest<{ email: string; role: string }>(`/invitation/${encodeURIComponent(token)}`)
      .then((payload) => {
        setInvitation(payload);
      })
      .catch((lookupError: unknown) => {
        setError(lookupError instanceof Error ? lookupError.message : 'This invitation could not be loaded.');
      });
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      if (!token) throw new Error('This invitation link is missing its token. Ask the clinic to send a new invitation.');
      if (!invitation?.email || !validateEmail(invitation.email)) throw new Error('A valid email address is required.');
      if (!name.trim() || name.trim().length < 2) throw new Error('Please enter your full name.');
      if (password.length < 8) throw new Error('Choose a password with at least 8 characters.');
      if (password !== confirmPassword) throw new Error('The password and confirmation do not match.');

      await apiRequest('/invitation/accept', {
        method: 'POST',
        body: JSON.stringify({ token, name: name.trim(), password }),
      });

      setNotice('Your account is ready. Sign in to your role portal to continue.');
      setTimeout(() => navigate(invitation.role.toUpperCase() === 'DOCTOR' ? '/login/doctor' : '/login/staff', { replace: true }), 900);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not accept this invitation. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      kicker="TEAM INVITATION"
      title={`Join as ${invitation?.role === 'DOCTOR' ? 'a Doctor' : 'a Staff member'}`}
      intro="Your invitation verifies the email address. Create your account to access your clinic workspace."
      actionText={<><span>Already registered?</span> <Link to={invitation?.role === 'DOCTOR' ? '/login/doctor' : '/login/staff'}>Go to role sign in</Link></>}
    >
      {invitationError || error ? <div className="notice notice-error" role="alert">{invitationError || error}</div> : null}
      {notice ? <div className="notice notice-success" role="status">{notice}</div> : null}

      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your full name" autoComplete="name" minLength={2} required /></label>
        <label>Email address<input value={invitation?.email ?? ''} readOnly type="email" placeholder="you@example.com" autoComplete="email" /></label>
        <label>
          Password
          <span className="password-field">
            <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? 'text' : 'password'} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </span>
        </label>
        <label>Confirm password<input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" placeholder="Enter your password again" autoComplete="new-password" minLength={8} required /></label>
        <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait...' : 'Create account'}<span aria-hidden="true">&#8594;</span></button>
      </form>
    </AuthShell>
  );
}

export default function AuthPage({ mode }: { mode?: AuthRouteMode } = {}) {
  const { role: routeRole = 'patient' } = useParams();
  const { pathname } = useLocation();

  if (mode === 'forgot-password' || pathname === '/forgot-password' || pathname === '/reset-password') return <PasswordRecoveryView />;
  if (pathname === '/accept-invitation') return <InvitationAcceptanceView />;
  if (routeRole === 'clinic' || pathname === '/login/clinic' || pathname === '/register/clinic') return <ClinicAuthView mode={mode} />;
  if (pathname === '/superadmin') return <SuperAdminAuthView />;

  if (routeRole === 'clinic' || pathname === '/register/clinic') return <ClinicAuthView mode={mode} />;
  if (routeRole === 'doctor' || routeRole === 'staff') return <PatientAuthView role={routeRole} />;
  return <PatientAuthView role="patient" mode={mode} />;
}