import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Form } from '@/components/atoms/Form';
import { Input } from '@/components/atoms/Input';
import { Notice } from '@/components/atoms/Notice';
import { FormField } from '@/components/molecules/FormField';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import type { Invitation } from '@/types';

export function InviteForm({ invitee, busy, invitation, onInvite }: {
  invitee: 'doctor' | 'staff member'; busy: boolean; invitation: Invitation | null; onInvite: (email: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [copy, setCopy] = useState('');

  async function copyLink() {
    if (!invitation) return;
    try { await navigator.clipboard.writeText(invitation.inviteUrl); setCopy('Invitation link copied.'); }
    catch { setCopy('Copy is unavailable in this browser. Select and copy the invitation link below.'); }
  }

  return (
    <>
      <SectionHeading title={`Invite a ${invitee}`} description="They will receive a secure link to create their account." />
      <Form onSubmit={(e) => { e.preventDefault(); onInvite(email); setEmail(''); }} className="grid-cols-[1fr_auto] items-end p-[19px] max-md:grid-cols-1">
        <FormField label="Email address"><Input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@clinic.com" autoComplete="email" required /></FormField>
        <Button className="min-w-[155px] max-md:w-full" disabled={busy}>{busy ? 'Sending...' : 'Create invitation'}</Button>
      </Form>
      {invitation ? (
        <Notice tone="success" className="mx-[19px]">
          <strong>Invitation sent</strong>
          <p>An invitation to join as a {invitation.role === 'DOCTOR' ? 'doctor' : 'staff member'} was emailed to {invitation.email}.</p>
          <FormField label="Invitation link" className="my-2"><Input value={invitation.inviteUrl} readOnly onFocus={(e) => e.currentTarget.select()} /></FormField>
          <Button type="button" variant="secondary" onClick={() => void copyLink()}>Copy invitation link</Button>
          {copy ? <p aria-live="polite">{copy}</p> : null}
        </Notice>
      ) : null}
    </>
  );
}