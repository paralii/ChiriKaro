import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';

type DoctorSummary = {
  id: string; userId: string; name: string; email: string; specializations: string[];
  verificationStatus: string; consultationFee: number | null; onboardingProgress: number;
};
type DoctorDetail = {
  phone: string | null;
  yearsOfExperience: number | null;
  firstName: string; lastName: string; professionalTitle: string | null; qualification: string | null;
  registrationNumber: string | null; registrationAuthority: string | null; bio: string | null;
  specializations: string[]; procedures: string[]; workingHours: Array<{ day: string; isOpen: boolean; startTime: string; endTime: string }>;
  documents: Array<{ documentType: string; status: string; rejectionReason?: string | null }>;
};

export function ClinicDoctorReviewPage({ accessToken }: { accessToken: string | null }) {
  const [doctors, setDoctors] = useState<DoctorSummary[]>([]);
  const [selected, setSelected] = useState<{ id: string; profile: DoctorDetail } | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [fees, setFees] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function refresh() {
    if (!accessToken) return;
    const result = await apiRequest<DoctorSummary[]>('/clinic/doctors', {}, accessToken);
    setDoctors(result);
    setFees(Object.fromEntries(result.map((doctor) => [doctor.id, doctor.consultationFee?.toString() ?? ''])));
  }

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    apiRequest<DoctorSummary[]>('/clinic/doctors', {}, accessToken)
      .then((result) => {
        if (cancelled) return;
        setDoctors(result);
        setFees(Object.fromEntries(result.map((doctor) => [doctor.id, doctor.consultationFee?.toString() ?? ''])));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : 'Could not load Doctors for review.');
      });
    return () => { cancelled = true; };
  }, [accessToken]);

  async function runAction(action: () => Promise<void>, successMessage: string) {
    setBusy(true); setError(''); setMessage('');
    try {
      await action();
      await refresh();
      setMessage(successMessage);
    } catch (actionError) { setError(actionError instanceof Error ? actionError.message : 'The Doctor update could not be saved.'); }
    finally { setBusy(false); }
  }

  function approve(doctor: DoctorSummary) {
    return runAction(async () => {
      await apiRequest(`/clinic/doctors/${doctor.id}/approve`, { method: 'POST' }, accessToken ?? undefined);
    }, `${doctor.name}'s profile was approved.`);
  }

  function reject(doctor: DoctorSummary) {
    const reason = reasons[doctor.id]?.trim() ?? '';
    if (reason.length < 5) { setError('Add a rejection reason of at least 5 characters.'); return; }
    return runAction(async () => {
      await apiRequest(`/clinic/doctors/${doctor.id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }, accessToken ?? undefined);
    }, `Changes requested from ${doctor.name}.`);
  }

  function saveFee(doctor: DoctorSummary) {
    const fee = Number(fees[doctor.id]);
    if (!Number.isFinite(fee) || fee <= 0) { setError('Consultation fee must be greater than zero.'); return; }
    return runAction(async () => {
      await apiRequest(`/clinic/doctors/${doctor.id}/fee`, { method: 'PATCH', body: JSON.stringify({ fee }) }, accessToken ?? undefined);
    }, `Consultation fee saved for ${doctor.name}.`);
  }

  async function inspect(doctor: DoctorSummary) {
    setBusy(true); setError('');
    try {
      const profile = await apiRequest<DoctorDetail>(`/clinic/doctors/${doctor.id}`, {}, accessToken ?? undefined);
      setSelected({ id: doctor.id, profile });
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load this Doctor profile.'); }
    finally { setBusy(false); }
  }

  async function openDocument(doctorId: string, documentType: string) {
    try {
      const result = await apiRequest<{ url: string }>(`/clinic/doctors/${doctorId}/documents/${encodeURIComponent(documentType)}/download-url`, {}, accessToken ?? undefined);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not open the document.'); }
  }

  return (
    <section className="content-section doctor-review">
      <div className="section-heading"><div><h2>Doctor review</h2><p>Review submitted profiles and configure consultation fees.</p></div></div>
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      {message ? <div className="notice notice-success" role="status">{message}</div> : null}
      {!doctors.length ? <div className="empty-state">No invited Doctors have started onboarding yet.</div> : <div className="table-wrap"><table className="clinic-table"><thead><tr><th>DOCTOR</th><th>ONBOARDING</th><th>REVIEW</th><th>CONSULTATION FEE</th><th>ACTIONS</th></tr></thead><tbody>
        {doctors.map((doctor) => <tr key={doctor.id}>
          <td><strong>{doctor.name}</strong><small>{doctor.email}</small><small>{doctor.specializations.join(', ') || 'Specialization not added'}</small></td>
          <td>{doctor.onboardingProgress}%</td>
          <td><span className={`table-status status-${doctor.verificationStatus.toLowerCase()}`}>{doctor.verificationStatus.replaceAll('_', ' ')}</span></td>
          <td><div className="fee-editor"><input aria-label={`Consultation fee for ${doctor.name}`} type="number" min="1" step="0.01" value={fees[doctor.id] ?? ''} onChange={(event) => setFees((current) => ({ ...current, [doctor.id]: event.target.value }))} placeholder="Set fee" /><button type="button" disabled={busy} onClick={() => void saveFee(doctor)}>Save</button></div></td>
          <td><div className="table-actions"><button type="button" disabled={busy} onClick={() => void inspect(doctor)}>Review profile</button>{doctor.verificationStatus === 'PENDING_VERIFICATION' ? <>
            <button type="button" disabled={busy} onClick={() => void approve(doctor)}>Approve</button>
            <label className="review-reason">Rejection reason<input value={reasons[doctor.id] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [doctor.id]: event.target.value }))} minLength={5} placeholder="What needs correction?" /></label>
            <button type="button" disabled={busy} onClick={() => void reject(doctor)}>Request changes</button>
          </> : null}</div></td>
        </tr>)}
      </tbody></table></div>}
      {selected ? <section className="review-detail"><div className="section-heading"><div><h3>{selected.profile.firstName} {selected.profile.lastName}</h3><p>{selected.profile.professionalTitle ?? 'Professional title not provided'} · {selected.profile.qualification ?? 'Qualification not provided'}</p></div><button type="button" className="text-link" onClick={() => setSelected(null)}>Close</button></div>
        <dl className="detail-list"><span>Phone</span><strong>{selected.profile.phone ?? 'Not provided'}</strong><span>Experience</span><strong>{selected.profile.yearsOfExperience ?? 'Not provided'}</strong><span>Registration</span><strong>{selected.profile.registrationNumber ?? 'Not provided'}</strong><span>Authority</span><strong>{selected.profile.registrationAuthority ?? 'Not provided'}</strong><span>Specializations</span><strong>{selected.profile.specializations.join(', ') || 'Not provided'}</strong><span>Procedures</span><strong>{selected.profile.procedures.join(', ') || 'Not provided'}</strong><span>Working hours</span><strong>{selected.profile.workingHours.filter((hours) => hours.isOpen).map((hours) => `${hours.day} ${hours.startTime}-${hours.endTime}`).join(', ') || 'Not provided'}</strong><span>About</span><strong>{selected.profile.bio ?? 'Not provided'}</strong></dl>
        <ul className="document-list">{selected.profile.documents.map((document) => <li key={document.documentType}><span>{document.documentType} <small>{document.status}</small></span><button type="button" className="text-link" onClick={() => void openDocument(selected.id, document.documentType)}>Open</button></li>)}</ul>
      </section> : null}
    </section>
  );
}