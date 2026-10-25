import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import type { Role } from '../store/slices/authSlice';
import { apiRequest } from '../lib/api';
import PortalShell from './portal/PortalShell';
import { ClinicManagementPage, StaffManagementPage, ClinicDirectoryPage } from './roles';
import { ClinicSetupPage } from './roles/clinic/ClinicSetupPage';
import { DoctorWorkspacePage } from './roles/doctor/DoctorWorkspacePage';
import { ClinicDoctorReviewPage } from './roles/clinic/ClinicDoctorReviewPage';

type Clinic = { id: string; name: string; address?: string | null; phone?: string | null; ownerName?: string; contactEmail?: string; status: string; isActive: boolean };
type Summary = { total: number; pending: number; approved: number; rejected: number; blocked: number };
type CreatedInvitation = { email: string; role: 'DOCTOR' | 'STAFF'; inviteUrl: string };

const roleLabels: Record<Role, string> = { patient: 'Patient', doctor: 'Doctor', clinic_admin: 'Clinic', staff: 'Staff', super_admin: 'Super admin' };
const roleHomes: Record<Role, string> = { patient: '/app/dashboard', doctor: '/app/dashboard', clinic_admin: '/app/dashboard', staff: '/app/dashboard', super_admin: '/app/dashboard' };

export default function PortalPage({ onLogout }: { onLogout: () => void }) {
  const { section = 'dashboard' } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useSelector((state: RootState) => state.auth);
  const role = user?.role ?? 'patient';
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [summary, setSummary] = useState<Summary>({ total: 0, pending: 0, approved: 0, rejected: 0, blocked: 0 });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordOtpCooldown, setPasswordOtpCooldown] = useState(0);
  const [passwordOtpSent, setPasswordOtpSent] = useState(false);
  const [passwordStep, setPasswordStep] = useState<'current' | 'new'>('current');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [createdInvitation, setCreatedInvitation] = useState<CreatedInvitation | null>(null);

  const isAdmin = role === 'super_admin';
  const isClinic = role === 'clinic_admin';
  const isPatient = role === 'patient';
  const isProfile = section === 'profile' || section === 'settings';
  const isClinics = section === 'clinics' || section === 'pending';
  useEffect(() => {
    const allowedSections = role === 'super_admin'
      ? ['dashboard', 'clinics', 'pending']
      : role === 'clinic_admin'
        ? ['dashboard', 'profile', 'settings', 'doctors', 'staff', 'review-doctors']
        : role === 'doctor'
          ? ['dashboard']
          : role === 'patient'
          ? ['dashboard', 'profile', 'settings', 'clinics']
          : ['dashboard', 'profile', 'settings'];
    if (!allowedSections.includes(section)) navigate(roleHomes[role], { replace: true });
  }, [navigate, role, section]);

  useEffect(() => {
    if (!accessToken) return;
    const load = async () => {
      setError('');
      try {
        if (isAdmin) {
          const [clinicList, counts] = await Promise.all([
            apiRequest<Clinic[]>('/super-admin/clinics', {}, accessToken),
            apiRequest<Summary>('/super-admin/clinics/dashboard', {}, accessToken),
          ]);
          setClinics(clinicList);
          setSummary(counts);
        } else if (isClinic) {
          setClinic(await apiRequest<Clinic>('/clinic/dashboard', {}, accessToken));
        }
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load this workspace.');
      }
    };
    void load();
  }, [accessToken, isAdmin, isClinic]);

  useEffect(() => {
    if (passwordOtpCooldown <= 0) return;
    const timer = window.setTimeout(() => setPasswordOtpCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [passwordOtpCooldown]);

  if (!user) return <Navigate to="/login/patient" replace />;

  const navItems: [string, string][] = isAdmin
    ? [['dashboard', 'Overview'], ['clinics', 'All clinics'], ['pending', 'Pending review']]
    : isClinic
      ? [['dashboard', 'Overview'], ['profile', 'Clinic setup'], ['doctors', 'Doctor invitations'], ['review-doctors', 'Doctor review'], ['staff', 'Staff invitations']]
      : role === 'doctor'
        ? [['dashboard', 'Onboarding']]
        : isPatient
        ? [['dashboard', 'Overview'], ['clinics', 'Find a clinic'], ['profile', 'My profile']]
        : [['dashboard', 'Overview'], ['profile', 'My profile']];

  const title = role === 'doctor' ? 'Doctor onboarding' : section === 'review-doctors' ? 'Doctor review' : isProfile ? (isClinic ? 'Clinic setup' : 'Your profile') : section === 'pending' ? 'Pending clinics' : section === 'clinics' ? (isPatient ? 'Find a clinic' : 'Clinic directory') : section === 'doctors' ? 'Doctor invitations' : section === 'staff' ? 'Staff invitations' : 'Overview';

  async function changeClinicStatus(id: string, status: string) {
    if (!accessToken) return;
    setBusy(true); setMessage(''); setError('');
    try {
      await apiRequest(`/super-admin/clinics/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: status.toUpperCase() }) }, accessToken);
      setClinics((existing) => existing.map((item) => item.id === id ? { ...item, status: status.toUpperCase(), isActive: status.toUpperCase() === 'APPROVED' } : item));
      const updated = await apiRequest<Summary>('/super-admin/clinics/dashboard', {}, accessToken);
      setSummary(updated);
      setMessage(`${status} action saved.`);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'Could not update clinic.'); }
    finally { setBusy(false); }
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = await apiRequest<{ name: string }>('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name: form.get('name') }) }, accessToken ?? undefined);
      setMessage(`Profile updated for ${updated.name}.`);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'Could not update profile.'); }
    finally { setBusy(false); }
  }

  async function requestPasswordOtp() {
    if (!user?.email) return;
    if (passwordStep !== 'new') {
      setError('Confirm your current password before requesting a verification code.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Choose a new password with at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation do not match.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    try {
      await apiRequest('/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ email: user.email, purpose: 'profile-change' }),
      }, accessToken ?? undefined);
      setPasswordOtpSent(true);
      setPasswordOtp('');
      setPasswordOtpCooldown(60);
      setMessage(`A password-change code was sent to ${user.email}. It expires in 10 minutes.`);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'Could not send verification code.'); }
    finally { setBusy(false); }
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      if (passwordStep === 'current') {
        if (!currentPassword) throw new Error('Enter your current password to continue.');
        await apiRequest('/auth/profile/password/verify-current', {
          method: 'POST',
          body: JSON.stringify({ currentPassword }),
        }, accessToken ?? undefined);
        setPasswordStep('new');
        setMessage('Current password confirmed. Choose a new password and request an email code.');
        return;
      }

      if (newPassword.length < 8) throw new Error('Choose a new password with at least 8 characters.');
      if (newPassword !== confirmPassword) throw new Error('The new password and confirmation do not match.');
      if (!passwordOtpSent) throw new Error('Request the email verification code before changing your password.');
      if (!/^\d{6}$/.test(passwordOtp.trim())) throw new Error('Enter the 6-digit code sent to your email.');

      await apiRequest('/auth/profile/password', {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword,
          newPassword,
          otp: passwordOtp.trim(),
        }),
      }, accessToken ?? undefined);
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtp('');
      setPasswordOtpSent(false);
      setPasswordOtpCooldown(0);
      setPasswordStep('current');
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'Could not update password.'); }
    finally { setBusy(false); }
  }

  async function sendInvitation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clinic) { setError('Clinic details are not available yet.'); return; }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = String(form.get('email') ?? '').trim().toLowerCase();
    const invitedRole = section === 'doctors' ? 'DOCTOR' : 'STAFF';
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await apiRequest<{ email: string; role: 'DOCTOR' | 'STAFF'; inviteUrl: string }>('/clinic/invite', { method: 'POST', body: JSON.stringify({ clinicId: clinic.id, email, role: invitedRole }) }, accessToken ?? undefined);
      setCreatedInvitation({ email: result.email, role: result.role, inviteUrl: result.inviteUrl });
      setMessage(`Invitation email sent to ${result.email}.`);
      formElement.reset();
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'Could not send invitation.'); }
    finally { setBusy(false); }
  }

  const clinicItems = isPatient ? [
    { id: 'greenwood', name: 'Greenwood Dental Care', address: 'Indiranagar, Bengaluru', phone: '+91 80 4123 0101', status: 'APPROVED', isActive: true },
    { id: 'smileworks', name: 'Smileworks Dental Studio', address: 'Koramangala, Bengaluru', phone: '+91 80 4123 0124', status: 'APPROVED', isActive: true },
    { id: 'brightline', name: 'Brightline Family Dentistry', address: 'HSR Layout, Bengaluru', phone: '+91 80 4123 0168', status: 'APPROVED', isActive: true },
  ] : clinics.filter((item) => section !== 'pending' || item.status === 'PENDING');

  return (
    <PortalShell role={role} userName={user.name} workspaceName={isClinic && clinic ? clinic.name : undefined} title={title} navItems={navItems} pendingCount={isAdmin ? summary.pending : 0} onLogout={onLogout}>
        <div className="portal-content"><div className="page-heading"><div><p className="eyebrow">{roleLabels[role]} workspace</p><h1>{title}</h1></div>{isClinic && (section === 'doctors' || section === 'staff') ? <span className="heading-chip">INVITATIONS</span> : null}</div>
          {error ? <div className="notice notice-error" role="alert">{error}</div> : null}{message ? <div className="notice notice-success" role="status">{message}</div> : null}

          {isAdmin && section === 'dashboard' ? <>
            <div className="metric-grid">{[['Total clinics', summary.total, 'Registered on ChiriKaro'], ['Pending review', summary.pending, 'Awaiting a decision'], ['Approved', summary.approved, 'Active clinic accounts'], ['Blocked', summary.blocked, 'Access currently paused']].map(([label, value, note]) => <article className="metric" key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>)}</div>
            <section className="content-section"><div className="section-heading"><div><h2>Recently registered</h2><p>Clinic applications that need attention</p></div><Link className="text-link" to="/app/pending">Review queue <span>&#8594;</span></Link></div><ClinicTable clinics={clinics.slice(0, 5)} onStatus={changeClinicStatus} busy={busy} /></section>
          </> : null}

          {role === 'doctor' && section === 'dashboard' ? <DoctorWorkspacePage accessToken={accessToken} /> : null}

          {isAdmin && isClinics ? <ClinicManagementPage clinics={clinics} section={section as 'clinics' | 'pending'} busy={busy} onStatus={changeClinicStatus} renderTable={(items, tableBusy, statusHandler) => <ClinicTable clinics={items} onStatus={statusHandler} busy={tableBusy} />} /> : null}

          {isClinic && section === 'dashboard' ? <><div className="welcome-band"><div><span className="status-pill">{clinic?.status ?? 'LOADING'}</span><h2>{clinic?.name ?? 'Your clinic workspace'}</h2><p>Keep your clinic information and team access up to date.</p></div><Link className="button button-secondary" to="/app/profile">Edit clinic profile</Link></div><div className="metric-grid metric-grid-clinic"><article className="metric"><span>Clinic status</span><strong className="metric-word">{clinic?.status ?? 'Loading'}</strong><small>Approval and account access</small></article><article className="metric"><span>Doctors</span><strong>Invite</strong><small>Bring clinicians into your workspace</small><Link to="/app/doctors">Manage invitations &#8594;</Link></article><article className="metric"><span>Staff</span><strong>Invite</strong><small>Give your team the right access</small><Link to="/app/staff">Manage invitations &#8594;</Link></article></div><section className="content-section"><div className="section-heading"><div><h2>Clinic details</h2><p>Information associated with your account</p></div></div><div className="detail-list"><span>Clinic</span><strong>{clinic?.name ?? 'Loading...'}</strong><span>Owner</span><strong>{clinic?.ownerName ?? user.name}</strong><span>Contact</span><strong>{clinic?.contactEmail ?? user.email}</strong><span>Address</span><strong>{clinic?.address ?? 'Not provided'}</strong></div></section></> : null}

          {isClinic && isProfile ? <ClinicSetupPage accessToken={accessToken} /> : null}

          {isClinic && (section === 'doctors' || section === 'staff') ? <StaffManagementPage section={section} busy={busy} onInvite={sendInvitation} invitation={createdInvitation} /> : null}
          {isClinic && section === 'review-doctors' ? <ClinicDoctorReviewPage accessToken={accessToken} /> : null}

          {isPatient && section === 'dashboard' ? <><div className="welcome-band patient-band"><div><p className="eyebrow">YOUR CARE, IN ONE PLACE</p><h2>Good to see you, {user.name.split(' ')[0]}.</h2><p>Your next step toward a healthier smile starts here.</p></div><span className="patient-stamp">CK</span></div><div className="metric-grid metric-grid-patient"><article className="metric"><span>Care profile</span><strong>Ready</strong><small>Your account is active</small><Link to="/app/profile">View profile &#8594;</Link></article><article className="metric"><span>Nearby clinics</span><strong>03</strong><small>Featured clinics in Bengaluru</small><Link to="/app/clinics">Explore clinics &#8594;</Link></article></div><section className="content-section"><div className="section-heading"><div><h2>Clinics to know</h2><p>Featured practices near you</p></div><Link className="text-link" to="/app/clinics">See all <span>&#8594;</span></Link></div><ClinicCards clinics={clinicItems.slice(0, 3)} /></section></> : null}

          {isPatient && section === 'clinics' ? <ClinicDirectoryPage clinics={clinicItems} renderCards={(items) => <ClinicCards clinics={items} />} /> : null}

          {!isClinic && !isAdmin && !isPatient && section === 'dashboard' ? <><div className="welcome-band"><div><span className="status-pill">ACCOUNT ACTIVE</span><h2>Welcome, {user.name}.</h2><p>Your {roleLabels[role].toLowerCase()} workspace is ready.</p></div><Link className="button button-secondary" to="/app/profile">View profile</Link></div><section className="content-section"><div className="section-heading"><div><h2>Workspace access</h2><p>You are signed in with the {roleLabels[role].toLowerCase()} role.</p></div></div><div className="detail-list"><span>Name</span><strong>{user.name}</strong><span>Email</span><strong>{user.email}</strong><span>Role</span><strong>{roleLabels[role]}</strong></div></section></> : null}

          {!isClinic && !isAdmin && isProfile ? <section className="form-section"><div className="section-heading"><div><h2>Personal information</h2><p>Update the name shown across your workspace</p></div></div><form className="portal-form profile-form" onSubmit={saveProfile}><label>Full name<input name="name" defaultValue={user.name} minLength={2} required /></label><label>Email address<input value={user.email} readOnly /></label><label>Account type<input value={roleLabels[role]} readOnly /></label><button className="button button-primary" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button></form>
            <form className="portal-form profile-form" onSubmit={changePassword}>
              <div className="section-heading"><div><h2>Security</h2><p>{passwordStep === 'current' ? 'Confirm your current password to begin.' : 'Choose a new password, then verify the change by email.'}</p></div></div>
              {passwordStep === 'current' ? <>
                <label>Current password<input value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} type="password" placeholder="Enter your current password" autoComplete="current-password" required /></label>
                <button className="button button-primary" disabled={busy}>{busy ? 'Checking...' : 'Continue'}</button>
              </> : <>
                <div className="notice notice-success" role="status">Current password confirmed</div>
                <label>New password<input value={newPassword} onChange={(event) => setNewPassword(event.target.value)} type="password" placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required /></label>
                <label>Confirm new password<input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} type="password" placeholder="Enter the new password again" autoComplete="new-password" minLength={8} required /></label>
                <div className="otp-row">
                  <label className="grow">Email verification code<input value={passwordOtp} onChange={(event) => setPasswordOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="6-digit code" maxLength={6} pattern="\d{6}" required /></label>
                  <button type="button" className="button button-secondary" disabled={passwordOtpCooldown > 0 || busy} onClick={requestPasswordOtp}>{passwordOtpCooldown > 0 ? `Resend (${passwordOtpCooldown}s)` : passwordOtpSent ? 'Resend code' : 'Send code'}</button>
                </div>
                <div className="otp-row">
                  <button type="button" className="text-link" disabled={busy} onClick={() => { setPasswordStep('current'); setPasswordOtpSent(false); setPasswordOtp(''); setPasswordOtpCooldown(0); }}>Back</button>
                  <button className="button button-primary" disabled={busy || !passwordOtpSent}>{busy ? 'Updating...' : 'Verify and change password'}</button>
                </div>
              </>}
            </form>
          </section> : null}
        </div>
    </PortalShell>
  );
}

function ClinicTable({ clinics, onStatus, busy }: { clinics: Clinic[]; onStatus: (id: string, status: string) => void; busy: boolean }) {
  if (!clinics.length) return <div className="empty-state">No clinics to show yet.</div>;
  return <div className="table-wrap"><table className="clinic-table"><thead><tr><th>CLINIC</th><th>OWNER</th><th>STATUS</th><th>CONTACT</th><th>ACTIONS</th></tr></thead><tbody>{clinics.map((clinic) => <tr key={clinic.id}><td><strong>{clinic.name}</strong><small>{clinic.address ?? 'Address not provided'}</small></td><td>{clinic.ownerName ?? '—'}</td><td><span className={`table-status status-${clinic.status.toLowerCase()}`}>{clinic.status}</span></td><td>{clinic.contactEmail ?? '—'}</td><td><div className="table-actions">{clinic.status === 'PENDING' ? <><button disabled={busy} onClick={() => onStatus(clinic.id, 'approved')}>Approve</button><button disabled={busy} onClick={() => onStatus(clinic.id, 'rejected')}>Reject</button></> : clinic.status === 'APPROVED' ? <button disabled={busy} onClick={() => onStatus(clinic.id, 'blocked')}>Block</button> : <button disabled={busy} onClick={() => onStatus(clinic.id, 'approved')}>Approve</button>}<details className="clinic-details"><summary>Details</summary><div><span>Clinic ID</span><strong>{clinic.id}</strong><span>Phone</span><strong>{clinic.phone ?? 'Not provided'}</strong><span>Account access</span><strong>{clinic.isActive ? 'Active' : 'Inactive'}</strong></div></details></div></td></tr>)}</tbody></table></div>;
}

function ClinicCards({ clinics }: { clinics: Clinic[] }) {
  return <div className="clinic-cards">{clinics.map((clinic, index) => <article className="clinic-card" key={clinic.id}><div className={`clinic-card-art clinic-art-${index + 1}`}><span>{clinic.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><i /></div><div className="clinic-card-copy"><span className="clinic-specialty">GENERAL DENTISTRY</span><h3>{clinic.name}</h3><p>{clinic.address}</p><div className="clinic-card-foot"><span>{clinic.phone}</span><button aria-label={`Contact ${clinic.name}`} title="Contact clinic">&#8599;</button></div></div></article>)}</div>;
}