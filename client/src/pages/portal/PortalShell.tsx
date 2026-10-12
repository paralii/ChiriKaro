import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import type { Role } from '../../store/slices/authSlice';

const roleLabels: Record<Role, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  clinic_admin: 'Clinic',
  staff: 'Staff',
  super_admin: 'Super admin',
};

interface PortalShellProps {
  role: Role;
  userName: string;
  workspaceName?: string;
  title: string;
  navItems: [string, string][];
  pendingCount?: number;
  onLogout: () => void;
  children: ReactNode;
}

export default function PortalShell({
  role,
  userName,
  workspaceName,
  title,
  navItems,
  pendingCount = 0,
  onLogout,
  children,
}: PortalShellProps) {
  return (
    <div className="portal-layout">
      <aside className="portal-sidebar">
        <Link className="brand-lockup" to="/"><span className="brand-mark">C</span><span>ChiriKaro</span></Link>
        <div className="workspace-label">WORKSPACE</div>
        <div className="workspace-identity"><span className="workspace-avatar">{roleLabels[role].slice(0, 1)}</span><div><strong>{workspaceName ?? `${roleLabels[role]} portal`}</strong><small>{roleLabels[role]} workspace</small></div><span className="workspace-chevron">&#8964;</span></div>
        <nav className="side-navigation" aria-label="Workspace navigation">
          {navItems.map(([path, label]) => <NavLink key={path} to={`/app/${path}`} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}><span className="side-link-mark" />{label}{path === 'pending' && pendingCount > 0 ? <span className="nav-count">{pendingCount}</span> : null}</NavLink>)}
        </nav>
        <div className="sidebar-bottom"><div className="sidebar-help"><span className="help-symbol">?</span><span><strong>Need a hand?</strong><small>Contact support</small></span></div><button className="side-link logout-link" onClick={onLogout}><span className="side-link-mark" />Sign out</button></div>
      </aside>
      <main className="portal-main">
        <header className="portal-topbar"><div className="breadcrumb">ChiriKaro <span>/</span> {title}</div><div className="topbar-user"><span className="topbar-date">Wednesday, 07 October 2026</span><span className="topbar-avatar">{userName.slice(0, 1).toUpperCase()}</span><span className="topbar-name">{userName}</span></div></header>
        {children}
      </main>
    </div>
  );
}
