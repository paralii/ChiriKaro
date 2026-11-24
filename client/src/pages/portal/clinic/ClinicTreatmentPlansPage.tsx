import { useEffect, useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Notice } from '@/components/atoms/Notice';
import { EmptyState } from '@/components/molecules/EmptyState';
import { http } from '@/shared/lib/http';
import { API_ROUTES } from '@/shared/constants/apiRoutes';
import { getErrorMessage } from '@/shared/lib/http';
type GuestPlan = { _id: string; title: string; patientName: string; patientUserId: string | null; status: string; diagnosis: string; version: number; procedures: Array<{ procedure: string; estimatedCost: number | null; requiredSessions: number | null }> };
type Envelope<T> = { data?: T };
export default function ClinicTreatmentPlansPage() {
  const [plans, setPlans] = useState<GuestPlan[]>([]); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const refresh = async () => { const response = await http.get<Envelope<GuestPlan[]>>(API_ROUTES.CLINIC.GUEST_TREATMENT_PLANS); if (!response.data.data) throw new Error('Guest plans were not returned.'); setPlans(response.data.data); };
  useEffect(() => { let active = true; http.get<Envelope<GuestPlan[]>>(API_ROUTES.CLINIC.GUEST_TREATMENT_PLANS).then((response) => { if (active && response.data.data) setPlans(response.data.data); }).catch((reason: unknown) => { if (active) setError(getErrorMessage(reason, 'Could not load guest treatment plans.')); }); return () => { active = false; }; }, []);
  const transition = async (plan: GuestPlan, status: string, note?: string) => { setBusy(true); setError(''); try { await http.patch(API_ROUTES.CLINIC.TREATMENT_PLAN_STATUS(plan._id), { status, ...(note ? { note } : {}) }); await refresh(); } catch (reason) { setError(getErrorMessage(reason, 'Could not update treatment plan.')); } finally { setBusy(false); } };
  return <div className="grid gap-4">{error ? <Notice tone="error">{error}</Notice> : null}{plans.length ? plans.map((plan) => <Card key={plan._id} className="grid gap-3 p-4"><div className="flex justify-between gap-2"><strong>{plan.title} · v{plan.version}</strong><span>{plan.status.replaceAll('_', ' ')}</span></div><p className="m-0">{plan.patientUserId ? 'Patient' : 'Guest patient'}: {plan.patientName}</p>{plan.diagnosis ? <p className="m-0">{plan.diagnosis}</p> : null}{plan.procedures.map((procedure, index) => <p key={`${plan._id}-${index}`} className="m-0">{procedure.procedure} · {procedure.requiredSessions ?? '—'} sessions · {procedure.estimatedCost == null ? '—' : `₹${procedure.estimatedCost.toFixed(2)}`}</p>)}{plan.status === 'PENDING_APPROVAL' && !plan.patientUserId ? <Button disabled={busy} onClick={() => { const note = window.prompt('Record the patient consent details'); if (note?.trim()) void transition(plan, 'APPROVED', note.trim()); }}>Record patient consent</Button> : null}{plan.status === 'APPROVED' ? <Button disabled={busy} onClick={() => void transition(plan, 'IN_PROGRESS')}>Start treatment</Button> : null}{plan.status === 'IN_PROGRESS' ? <Button disabled={busy} onClick={() => void transition(plan, 'COMPLETED')}>Mark completed</Button> : null}</Card>) : <Card><EmptyState><p>No treatment plans require clinic action.</p></EmptyState></Card>}</div>;
}
