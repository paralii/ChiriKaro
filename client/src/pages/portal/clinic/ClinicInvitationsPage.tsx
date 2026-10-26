import { useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { Notices } from '@/components/molecules/Notices';
import { InviteForm } from '@/components/organisms/InviteForm';
import { useAction } from '@/hooks/useAction';
import { clinicService } from '@/services/clinicService';
import { useAppSelector } from '@/store/hooks';
import { normalizeEmail } from '@/utils/validators';
import type { Invitation } from '@/types';

export default function ClinicInvitationsPage({ invitee }: { invitee: 'doctor' | 'staff' }) {
  const clinic = useAppSelector((s) => s.clinic.current);
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const { busy, error, message, setError, run } = useAction();

  const invite = (email: string) => {
    if (!clinic) return setError('Clinic details are not available yet.');
    void run(async () => {
      const result = await clinicService.invite({ clinicId: clinic.id, email: normalizeEmail(email), role: invitee === 'doctor' ? 'DOCTOR' : 'STAFF' });
      setInvitation(result);
      return result;
    }, { success: (r) => `Invitation email sent to ${r.email}.`, fallback: 'Could not send invitation.' });
  };

  return (
    <>
      <Notices error={error} message={message} />
      <Card className="pb-5"><InviteForm invitee={invitee === 'doctor' ? 'doctor' : 'staff member'} busy={busy} invitation={invitation} onInvite={invite} /></Card>
    </>
  );
}