import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { DataTable, tdClass } from '@/components/molecules/DataTable';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Notices } from '@/components/molecules/Notices';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { InviteForm } from '@/features/clinic/components/InviteForm';
import { useAction } from '@/shared/hooks/useAction';
import { clinicService } from '@/features/clinic/services/clinicService';
import { normalizeEmail } from '@/shared/utils/validators';
import type { Invitation } from '@/shared/types';

export default function ClinicInvitationsPage({ invitee }: { invitee: 'doctor' | 'staff' }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const { busy, error, message, setError, run } = useAction();

  const refresh = useCallback(async () => {
    const result = await clinicService.listPendingInvitations();
    setInvitations(result);
    return result;
  }, []);

  useEffect(() => {
    void run(refresh, { fallback: 'Could not load pending invitations.' });
  }, [refresh, run]);

  const invite = (email: string) => {
    if (!email.trim()) return setError('Enter an email address.');
    void run(async () => {
      const result = await clinicService.invite({ email: normalizeEmail(email), role: invitee === 'doctor' ? 'DOCTOR' : 'STAFF' });
      setInvitation(result);
      await refresh();
      return result;
    }, { success: (r) => `Invitation email sent to ${r.email}.`, fallback: 'Could not send invitation.' });
  };

  const resend = (id: string) => void run(async () => {
    const result = await clinicService.resendInvitation(id);
    await refresh();
    return result;
  }, { success: (result) => `Invitation email resent to ${result.email}.`, fallback: 'Could not resend invitation.' });

  return (
    <>
      <Notices error={error} message={message} />
      <Card className="pb-5"><InviteForm invitee={invitee === 'doctor' ? 'doctor' : 'staff member'} busy={busy} invitation={invitation} onInvite={invite} /></Card>
      <Card>
        <SectionHeading title="Pending invitations" description={`${invitations.length} invitation${invitations.length === 1 ? '' : 's'} awaiting acceptance.`} />
        {invitations.length ? (
          <DataTable headers={['EMAIL', 'ROLE', 'CREATED', 'EXPIRES', 'STATUS', 'ACTIONS']}>
            {invitations.map((item) => (
              <tr key={item.id}>
                <td className={tdClass}>{item.email}</td>
                <td className={tdClass}>{item.role === 'DOCTOR' ? 'Doctor' : 'Staff'}</td>
                <td className={tdClass}>{new Date(item.createdAt).toLocaleDateString()}</td>
                <td className={tdClass}>{new Date(item.expiresAt).toLocaleDateString()}</td>
                <td className={tdClass}><Badge>{item.status}</Badge></td>
                <td className={tdClass}><Button size="xs" variant="ghost" disabled={busy} onClick={() => resend(item.id)}>Resend</Button></td>
              </tr>
            ))}
          </DataTable>
        ) : <EmptyState>No pending invitations.</EmptyState>}
      </Card>
    </>
  );
}
