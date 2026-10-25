import { useState, type FormEvent } from 'react';

interface InvitationConfirmation {
  email: string;
  role: 'DOCTOR' | 'STAFF';
  inviteUrl: string;
}

export function StaffManagementPage({
  section,
  busy,
  onInvite,
  invitation,
}: {
  section: 'doctors' | 'staff';
  busy: boolean;
  onInvite: (event: FormEvent<HTMLFormElement>) => void;
  invitation: InvitationConfirmation | null;
}) {
  const [copyMessage, setCopyMessage] = useState('');
  const invitee = section === 'doctors' ? 'doctor' : 'staff member';

  async function copyInvitationLink() {
    if (!invitation) return;
    try {
      await navigator.clipboard.writeText(invitation.inviteUrl);
      setCopyMessage('Invitation link copied.');
    } catch {
      setCopyMessage('Copy is unavailable in this browser. Select and copy the invitation link below.');
    }
  }

  return (
    <section className="form-section invite-section">
      <div className="section-heading"><div><h2>Invite a {invitee}</h2><p>They will receive a secure link to create their account.</p></div></div>
      <form className="portal-form inline-form" onSubmit={onInvite}>
        <label>Email address<input name="email" type="email" placeholder="teammate@clinic.com" autoComplete="email" required /></label>
        <button className="button button-primary" disabled={busy}>{busy ? 'Sending...' : 'Create invitation'}</button>
      </form>
      {invitation ? <div className="notice notice-success" role="status">
        <strong>Invitation sent</strong>
        <p>An invitation to join as a {invitation.role === 'DOCTOR' ? 'doctor' : 'staff member'} was emailed to {invitation.email}.</p>
        <label>Invitation link<input value={invitation.inviteUrl} readOnly onFocus={(event) => event.currentTarget.select()} /></label>
        <button type="button" className="button button-secondary" onClick={() => void copyInvitationLink()}>Copy invitation link</button>
        {copyMessage ? <p aria-live="polite">{copyMessage}</p> : null}
      </div> : null}
    </section>
  );
}
