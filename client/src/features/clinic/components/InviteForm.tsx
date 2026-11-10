import { useState } from 'react';
import { Button } from '@components/atoms/Button';
import { Form } from '@components/atoms/Form';
import { Input } from '@components/atoms/Input';
import { Notice } from '@components/atoms/Notice';
import { FormField } from '@components/molecules/FormField';
import { SectionHeading } from '@components/molecules/SectionHeading';
import type { Invitation } from '@shared/types';

export function InviteForm({ invitee, busy, invitation, onInvite }: {
  invitee: 'doctor' | 'staff member'; busy: boolean; invitation: Invitation | null; onInvite: (email: string) => void;
}) {
  const [email, setEmail] = useState('');

  return (
    <>
      <SectionHeading title={`Invite a ${invitee}`} description={invitee === 'doctor' ? 'Send a secure invitation so a doctor can create an account, complete their professional profile, and submit documents for clinic review.' : 'Send a secure invitation so a staff member can create an account and join your clinic workspace.'} />
      <Form onSubmit={(e) => { e.preventDefault(); onInvite(email); setEmail(''); }} className="grid-cols-[1fr_auto] items-end p-[19px] max-md:grid-cols-1">
        <FormField label="Email address"><Input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@clinic.com" autoComplete="email" required /></FormField>
        <Button className="min-w-[155px] max-md:w-full" disabled={busy}>{busy ? 'Sending...' : 'Create invitation'}</Button>
      </Form>
      {invitation ? (
        <Notice tone="success" className="mx-[19px]">
          <strong>Invitation sent</strong>
          <p>An invitation to join as a {invitation.role === 'DOCTOR' ? 'doctor' : 'staff member'} was emailed to {invitation.email}.</p>
          <p className="mb-0">The invitation expires {new Date(invitation.expiresAt).toLocaleString()}.</p>
        </Notice>
      ) : null}
    </>
  );
}
