import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { getErrorMessage } from '@/shared/lib/http';
import { consultationService, type ConsultationData, type MedicalHistory, type PatientBrief, type PatientInsights, type SymptomAnalysis } from './consultationService';
import { AIRequestGuard, type AIRequestFeature } from './AIRequestGuard';
import { retryCountdownSeconds, retryDelaySeconds } from './AIRetryPolicy';

type Feature = AIRequestFeature;
type AIResult = SymptomAnalysis | PatientBrief | PatientInsights;
type FeatureState = { result: AIResult | null; error: string; busy: boolean; retryAt: number | null; stale: boolean; reviewed: boolean; symptomSnapshot: string | null };
const features: Feature[] = ['symptoms', 'brief', 'insights'];
const headings: Record<Feature, string> = { symptoms: 'Symptom analysis', brief: 'Patient brief', insights: 'Patient insights' };
const emptyState = (): FeatureState => ({ result: null, error: '', busy: false, retryAt: null, stale: false, reviewed: false, symptomSnapshot: null });
const outputList = (title: string, rows: string[]) => <section className="grid gap-2"><h4 className="m-0 text-sm font-semibold">{title}</h4>{rows.length ? <ul className="m-0 grid gap-1 pl-5 text-sm text-text-secondary">{rows.map((row, index) => <li key={`${title}-${index}`}>{row}</li>)}</ul> : <p className="m-0 text-sm text-text-muted">No information returned.</p>}</section>;
const retrySeconds = (error: unknown, attempt: number): number | null => {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const supplied = error.response?.data && typeof error.response.data === 'object' ? (error.response.data as { retryAfterSeconds?: unknown }).retryAfterSeconds : undefined;
    return retryDelaySeconds(status, supplied, !error.response, attempt);
  }
  return null;
};

export function ConsultationAIAssistance({ consultationId, patientAvailable, editable, data, medicalHistory }: { consultationId: string; patientAvailable: boolean; editable: boolean; data: ConsultationData; medicalHistory: MedicalHistory }) {
  const [feature, setFeature] = useState<Feature>('symptoms');
  const [states, setStates] = useState<Record<Feature, FeatureState>>({ symptoms: emptyState(), brief: emptyState(), insights: emptyState() });
  const [now, setNow] = useState(Date.now());
  const requestGuard = useRef(new AIRequestGuard());
  const attempts = useRef<Record<Feature, number>>({ symptoms: 0, brief: 0, insights: 0 });
  const inFlight = useRef<Record<Feature, boolean>>({ symptoms: false, brief: false, insights: false });
  const freshnessInFlight = useRef<Record<Feature, boolean>>({ symptoms: false, brief: false, insights: false });
  const mounted = useRef(false);
  const consultationRef = useRef(consultationId);
  const stateRef = useRef(states);
  const dataRef = useRef({ data, medicalHistory });
  const symptomSnapshot = JSON.stringify({ chiefComplaint: data.chiefComplaint, symptoms: data.symptoms.slice(0, 20), painLevel: data.painLevel, examinationFindings: data.examinationFindings, clinicalNotes: data.clinicalNotes, medicalHistory: { existingConditions: medicalHistory.existingConditions.slice(0, 20), allergies: medicalHistory.allergies.slice(0, 20), medications: medicalHistory.medications.slice(0, 20), previousSurgeries: medicalHistory.previousSurgeries.slice(0, 10), dentalHistory: medicalHistory.dentalHistory } });
  stateRef.current = states;
  dataRef.current = { data, medicalHistory };
  consultationRef.current = consultationId;

  useEffect(() => {
    mounted.current = true;
    const guard = requestGuard.current;
    return () => { mounted.current = false; guard.cancelAll(); };
  }, []);

  useEffect(() => {
    requestGuard.current.switchConsultation(consultationId);
    for (const key of features) { inFlight.current[key] = false; freshnessInFlight.current[key] = false; }
    attempts.current = { symptoms: 0, brief: 0, insights: 0 };
    setStates({ symptoms: emptyState(), brief: emptyState(), insights: emptyState() });
  }, [consultationId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const checkFreshness = async (key: Feature) => {
    const current = stateRef.current[key];
    if (!current.result?.inputFingerprint || freshnessInFlight.current[key]) return;
    freshnessInFlight.current[key] = true;
    const id = consultationRef.current;
    try {
      const inputs = dataRef.current;
      const symptomInput = { chiefComplaint: inputs.data.chiefComplaint, symptoms: inputs.data.symptoms, painLevel: inputs.data.painLevel, examinationFindings: inputs.data.examinationFindings, clinicalNotes: inputs.data.clinicalNotes, medicalHistory: inputs.medicalHistory };
      const result = await consultationService.aiFreshness(id, key, current.result.inputFingerprint, key === 'symptoms' ? symptomInput : undefined);
      if (!mounted.current || consultationRef.current !== id) return;
      setStates((previous) => previous[key].result?.inputFingerprint === current.result?.inputFingerprint
        ? { ...previous, [key]: { ...previous[key], stale: previous[key].stale || !result.current } }
        : previous);
    } catch {
      if (mounted.current && consultationRef.current === id) setStates((previous) => previous[key].result?.inputFingerprint === current.result?.inputFingerprint ? { ...previous, [key]: { ...previous[key], stale: true } } : previous);
    } finally { freshnessInFlight.current[key] = false; }
  };

  useEffect(() => {
    const generatedSnapshot = stateRef.current.symptoms.symptomSnapshot;
    if (generatedSnapshot && generatedSnapshot !== symptomSnapshot) setStates((previous) => ({ ...previous, symptoms: { ...previous.symptoms, stale: true, reviewed: false } }));
    void checkFreshness('symptoms');
  }, [symptomSnapshot, consultationId]);
  useEffect(() => {
    const refresh = () => { for (const key of features) void checkFreshness(key); };
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { window.removeEventListener('focus', refresh); window.clearInterval(timer); };
  }, [consultationId]);

  const generate = async (key: Feature) => {
    if (!editable || (key !== 'symptoms' && !patientAvailable) || inFlight.current[key]) return;
    const retryAt = stateRef.current[key].retryAt;
    if (retryAt && retryAt > Date.now()) return;
    inFlight.current[key] = true;
    const id = consultationId;
    const requestId = requestGuard.current.begin(key, id);
    setStates((previous) => ({ ...previous, [key]: { ...previous[key], busy: true, error: '', retryAt: null, reviewed: false } }));
    try {
      let result: AIResult;
      const values = dataRef.current;
      if (key === 'symptoms') result = await consultationService.analyzeSymptoms(id, { chiefComplaint: values.data.chiefComplaint, symptoms: values.data.symptoms, painLevel: values.data.painLevel, examinationFindings: values.data.examinationFindings, clinicalNotes: values.data.clinicalNotes }, values.medicalHistory);
      else if (key === 'brief') result = await consultationService.patientBrief(id);
      else result = await consultationService.insights(id);
      if (!mounted.current || !requestGuard.current.isCurrent(key, id, requestId)) return;
      attempts.current[key] = 0;
      setStates((previous) => ({ ...previous, [key]: { ...previous[key], result, busy: false, error: '', stale: !result.inputFingerprint, reviewed: false, symptomSnapshot: key === 'symptoms' ? symptomSnapshot : null } }));
      window.setTimeout(() => { if (mounted.current && consultationRef.current === id) void checkFreshness(key); }, 0);
    } catch (reason) {
      if (!mounted.current || !requestGuard.current.isCurrent(key, id, requestId)) return;
      attempts.current[key] += 1;
      const delay = retrySeconds(reason, attempts.current[key]);
      setStates((previous) => ({ ...previous, [key]: { ...previous[key], busy: false, error: getErrorMessage(reason, `Could not generate ${headings[key].toLowerCase()}.`), retryAt: delay === null ? null : Date.now() + delay * 1000 } }));
    } finally {
      if (requestGuard.current.isCurrent(key, id, requestId)) inFlight.current[key] = false;
    }
  };

  const dismiss = (key: Feature) => setStates((previous) => ({ ...previous, [key]: { ...emptyState() } }));
  const current = states[feature];
  const canRequest = editable && (feature === 'symptoms' || patientAvailable);
  const waitSeconds = retryCountdownSeconds(current.retryAt, now);

  return <Card className="grid gap-4 p-4 sm:p-5">
    <div><div className="flex flex-wrap items-center gap-2"><h2 className="m-0 text-base font-semibold">AI clinical assistance</h2><span className="rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">AI-generated suggestions</span></div><p className="mb-0 mt-1 text-sm text-text-muted">Relevant clinical information from this consultation and authorized history is shared with the configured AI provider for analysis. Free-text notes may contain identifying details despite safeguards. Review all output independently; it does not create or change the clinical record.</p></div>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="AI assistance features">{features.map((key) => <button key={key} type="button" role="tab" aria-selected={feature === key} onClick={() => setFeature(key)} className={`rounded-ui border px-3 py-2 text-sm font-medium ${feature === key ? 'border-focus-ring bg-info-soft text-info' : 'border-border bg-surface-elevated text-text-secondary'}`}>{headings[key]}{states[key].busy ? ' · running' : ''}</button>)}</div>
    {!editable ? <p className="m-0 text-sm text-text-muted">AI assistance is available while a consultation is in progress.</p> : !canRequest ? <p className="m-0 text-sm text-text-muted">A registered patient account is needed to review historical records. Symptom analysis is available for this visit.</p> : null}
    {current.error ? <div className="grid gap-2 rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger" role="alert"><p className="m-0">{current.error}</p>{current.retryAt === null ? <p className="m-0">This issue cannot be retried here. Check the input or contact support if the service is unavailable.</p> : <><p className="m-0">{waitSeconds ? `You can retry in ${waitSeconds} second${waitSeconds === 1 ? '' : 's'}.` : 'The provider is available to retry.'}</p><div><Button size="xs" variant="secondary" disabled={current.busy || waitSeconds > 0} onClick={() => void generate(feature)}>Retry</Button></div></>}</div> : null}
    {current.busy ? <div className="rounded-md border border-border p-3 text-sm text-text-muted" role="status">Generating {headings[feature].toLowerCase()}…</div> : null}
    {!current.busy && !current.error && !current.result ? <div className="rounded-md border border-dashed border-border p-3 text-sm text-text-muted">Generate an advisory {headings[feature].toLowerCase()} from the information currently available to this doctor.</div> : null}
    {!current.busy && current.result ? <div className="grid gap-4 rounded-md border border-border p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-text-primary">AI-generated · Doctor review required · {current.stale ? <span className="text-danger">Stale — regenerate before use</span> : 'Current'}</strong><Button size="xs" variant="secondary" onClick={() => dismiss(feature)}>Dismiss</Button></div>
      {feature === 'symptoms' && 'summary' in current.result ? <><section className="grid gap-1"><h3 className="m-0 text-sm font-semibold">Summary</h3><p className="m-0 text-sm text-text-secondary">{current.result.summary}</p></section><section className="grid gap-2"><h3 className="m-0 text-sm font-semibold">Possible clinical considerations</h3>{current.result.considerations.length ? current.result.considerations.map((item, index) => <article key={`${item.consideration}-${index}`} className="rounded-md bg-surface p-3 text-sm"><strong>{item.consideration}</strong><p className="mb-0 mt-1 text-text-secondary">{item.rationale}</p></article>) : <p className="m-0 text-sm text-text-muted">No considerations returned.</p>}</section>{outputList('Questions to consider asking', current.result.questions)}{outputList('Potential warning signs to assess', current.result.warningSigns)}</> : null}
      {feature === 'brief' && 'overview' in current.result ? <><section className="grid gap-1"><h3 className="m-0 text-sm font-semibold">Overview</h3><p className="m-0 text-sm text-text-secondary">{current.result.overview}</p></section>{outputList('Medical history', current.result.medicalHistory)}{outputList('Previous diagnoses', current.result.previousDiagnoses)}{outputList('Prescriptions recorded', current.result.prescriptions)}{outputList('Treatment history', current.result.treatmentHistory)}{outputList('Follow-up history', current.result.followUps)}{outputList('Records reviewed', current.result.recordsReviewed)}</> : null}
      {feature === 'insights' && 'recordedFacts' in current.result ? <>{current.result.insufficientInformation ? <p className="m-0 rounded-md bg-surface p-3 text-sm text-text-muted">There is not enough historical information to support a reliable pattern.</p> : null}{outputList('Recorded facts', current.result.recordedFacts)}{outputList('AI interpretations', current.result.interpretations)}</> : null}
      <label className="flex items-start gap-2 border-t border-border pt-3 text-sm text-text-secondary"><input type="checkbox" disabled={current.stale} checked={current.reviewed && !current.stale} onChange={(event) => setStates((previous) => ({ ...previous, [feature]: { ...previous[feature], reviewed: event.target.checked } }))} /><span>{current.stale ? 'Regenerate this result before marking it reviewed.' : 'I reviewed these suggestions. They remain advisory and are not added to the record.'}</span></label>
    </div> : null}
    {canRequest && !current.error ? <Button disabled={current.busy || waitSeconds > 0} onClick={() => void generate(feature)}>{current.busy ? 'Generating…' : current.result ? current.stale ? 'Regenerate stale result' : 'Generate again' : `Generate ${headings[feature].toLowerCase()}`}</Button> : null}
  </Card>;
}
