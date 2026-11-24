import { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { getErrorMessage } from '@/shared/lib/http';
import { consultationService, type ConsultationData, type MedicalHistory, type PatientBrief, type PatientInsights, type SymptomAnalysis } from './consultationService';

type Feature = 'symptoms' | 'brief' | 'insights';
const headings: Record<Feature, string> = { symptoms: 'Symptom analysis', brief: 'Patient brief', insights: 'Patient insights' };
const outputList = (title: string, rows: string[]) => <section className="grid gap-2"><h4 className="m-0 text-sm font-semibold">{title}</h4>{rows.length ? <ul className="m-0 grid gap-1 pl-5 text-sm text-text-secondary">{rows.map((row, index) => <li key={`${title}-${index}`}>{row}</li>)}</ul> : <p className="m-0 text-sm text-text-muted">No information returned.</p>}</section>;

export function ConsultationAIAssistance({ consultationId, patientAvailable, editable, data, medicalHistory }: { consultationId: string; patientAvailable: boolean; editable: boolean; data: ConsultationData; medicalHistory: MedicalHistory }) {
  const [feature, setFeature] = useState<Feature>('symptoms');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [symptomResult, setSymptomResult] = useState<SymptomAnalysis | null>(null);
  const [briefResult, setBriefResult] = useState<PatientBrief | null>(null);
  const [insightsResult, setInsightsResult] = useState<PatientInsights | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const currentResult = feature === 'symptoms' ? symptomResult : feature === 'brief' ? briefResult : insightsResult;
  const canRequest = editable && (feature === 'symptoms' || patientAvailable);

  const generate = async () => {
    if (!canRequest || busy) return;
    setBusy(true); setError(''); setReviewed(false);
    try {
      if (feature === 'symptoms') setSymptomResult(await consultationService.analyzeSymptoms(consultationId, { chiefComplaint: data.chiefComplaint, symptoms: data.symptoms, painLevel: data.painLevel, examinationFindings: data.examinationFindings, clinicalNotes: data.clinicalNotes }, medicalHistory));
      if (feature === 'brief') setBriefResult(await consultationService.patientBrief(consultationId));
      if (feature === 'insights') setInsightsResult(await consultationService.insights(consultationId));
    } catch (reason) { setError(getErrorMessage(reason, `Could not generate ${headings[feature].toLowerCase()}.`)); }
    finally { setBusy(false); }
  };
  const dismiss = () => {
    if (feature === 'symptoms') setSymptomResult(null);
    if (feature === 'brief') setBriefResult(null);
    if (feature === 'insights') setInsightsResult(null);
    setReviewed(false);
  };

  return <Card className="grid gap-4 p-4 sm:p-5">
    <div><div className="flex flex-wrap items-center gap-2"><h2 className="m-0 text-base font-semibold">AI clinical assistance</h2><span className="rounded-full bg-info-soft px-2.5 py-1 text-xs font-semibold text-info">AI-generated suggestions</span></div><p className="mb-0 mt-1 text-sm text-text-muted">De-identified context is sent to the configured AI provider. Review all output independently; it does not create or change the clinical record.</p></div>
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="AI assistance features">{(Object.keys(headings) as Feature[]).map((key) => <button key={key} type="button" role="tab" aria-selected={feature === key} onClick={() => { setFeature(key); setError(''); setReviewed(false); }} className={`rounded-ui border px-3 py-2 text-sm font-medium ${feature === key ? 'border-focus-ring bg-info-soft text-info' : 'border-border bg-surface-elevated text-text-secondary'}`}>{headings[key]}</button>)}</div>
    {!editable ? <p className="m-0 text-sm text-text-muted">AI assistance is available while a consultation is in progress.</p> : !canRequest ? <p className="m-0 text-sm text-text-muted">A registered patient account is needed to review historical records. Symptom analysis is available for this visit.</p> : null}
    {error ? <div className="grid gap-2 rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger" role="alert"><p className="m-0">{error}</p><div><Button size="xs" variant="secondary" disabled={busy} onClick={() => void generate()}>Retry</Button></div></div> : null}
    {busy ? <div className="rounded-md border border-border p-3 text-sm text-text-muted" role="status">Generating {headings[feature].toLowerCase()}…</div> : null}
    {!busy && !error && !currentResult ? <div className="rounded-md border border-dashed border-border p-3 text-sm text-text-muted">Generate an advisory {headings[feature].toLowerCase()} from the information currently available to this doctor.</div> : null}
    {!busy && currentResult ? <div className="grid gap-4 rounded-md border border-border p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-sm text-text-primary">AI-generated · Doctor review required</strong><Button size="xs" variant="secondary" onClick={dismiss}>Dismiss</Button></div>
      {feature === 'symptoms' && symptomResult ? <><section className="grid gap-1"><h3 className="m-0 text-sm font-semibold">Summary</h3><p className="m-0 text-sm text-text-secondary">{symptomResult.summary}</p></section><section className="grid gap-2"><h3 className="m-0 text-sm font-semibold">Possible clinical considerations</h3>{symptomResult.considerations.length ? symptomResult.considerations.map((item, index) => <article key={`${item.consideration}-${index}`} className="rounded-md bg-surface p-3 text-sm"><strong>{item.consideration}</strong><p className="mb-0 mt-1 text-text-secondary">{item.rationale}</p></article>) : <p className="m-0 text-sm text-text-muted">No considerations returned.</p>}</section>{outputList('Questions to consider asking', symptomResult.questions)}{outputList('Potential warning signs to assess', symptomResult.warningSigns)}</> : null}
      {feature === 'brief' && briefResult ? <><section className="grid gap-1"><h3 className="m-0 text-sm font-semibold">Overview</h3><p className="m-0 text-sm text-text-secondary">{briefResult.overview}</p></section>{outputList('Medical history', briefResult.medicalHistory)}{outputList('Previous diagnoses', briefResult.previousDiagnoses)}{outputList('Prescriptions recorded', briefResult.prescriptions)}{outputList('Treatment history', briefResult.treatmentHistory)}{outputList('Follow-up history', briefResult.followUps)}{outputList('Records reviewed', briefResult.recordsReviewed)}</> : null}
      {feature === 'insights' && insightsResult ? <>{insightsResult.insufficientInformation ? <p className="m-0 rounded-md bg-surface p-3 text-sm text-text-muted">There is not enough historical information to support a reliable pattern.</p> : null}{outputList('Recorded facts', insightsResult.recordedFacts)}{outputList('AI interpretations', insightsResult.interpretations)}</> : null}
      <label className="flex items-start gap-2 border-t border-border pt-3 text-sm text-text-secondary"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /><span>I reviewed these suggestions. They remain advisory and are not added to the record.</span></label>
    </div> : null}
    {canRequest ? <Button disabled={busy} onClick={() => void generate()}>{busy ? 'Generating…' : currentResult ? 'Generate again' : `Generate ${headings[feature].toLowerCase()}`}</Button> : null}
  </Card>;
}
