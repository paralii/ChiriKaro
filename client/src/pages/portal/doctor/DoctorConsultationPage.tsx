import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { StepTabs } from '@/components/molecules/StepTabs';
import { Notices } from '@/components/molecules/Notices';
import { consultationService, type Consultation, type ConsultationData, type MedicalHistory } from '@/features/doctor/consultation/consultationService';
import { getErrorMessage } from '@/shared/lib/http';
import { ConsultationFollowUpsPlans } from '@/features/doctor/consultation/ConsultationFollowUpsPlans';
import { ConsultationAIAssistance } from '@/features/doctor/consultation/ConsultationAIAssistance';

const tabs = ['Patient Overview', 'Medical History', 'Clinical Examination', 'Dental Chart', 'Diagnosis', 'Treatment Plan', 'Prescription', 'Attachments'];
type RowKey = 'dentalChart' | 'diagnoses' | 'treatmentPlan' | 'prescriptions';
const panel = 'grid gap-4 rounded-lg border border-border bg-surface-elevated p-4 sm:p-5';
const label = 'grid gap-1.5 text-sm font-medium text-text-primary';
const area = 'min-h-24 w-full rounded-ui border border-border-strong bg-surface-elevated p-3 text-sm text-text-primary outline-none focus-visible:ring-2 focus-visible:ring-focus-ring';

export default function DoctorConsultationPage() {
  const { consultationId } = useParams();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const queueEntryId = query.get('queueEntryId');
  const [record, setRecord] = useState<Consultation | null>(null);
  const [data, setData] = useState<ConsultationData>(consultationService.emptyData);
  const [history, setHistory] = useState<MedicalHistory>(consultationService.emptyHistory);
  const [historyMeta, setHistoryMeta] = useState<{ updatedBy: string | null; updatedAt: string | null }>({ updatedBy: null, updatedAt: null });
  const [previous, setPrevious] = useState<Consultation[]>([]);
  const [tab, setTab] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const accept = useCallback((next: Consultation) => { setRecord(next); setData(next.data); setHistory(next.medicalHistorySnapshot); }, []);
  useEffect(() => {
    let alive = true;
    setLoading(true);
    const task = consultationId ? consultationService.get(consultationId) : queueEntryId ? consultationService.open(queueEntryId) : Promise.reject(new Error('Open this screen from a queue entry.'));
    void task.then(async (result) => {
      if (!alive) return;
      accept(result);
      if (result.patientUserId) {
        const [historyResult, consultations] = await Promise.all([consultationService.getMedicalHistory(result.patientUserId), consultationService.history(result.patientUserId)]);
        if (alive) { setHistory(historyResult.history); setHistoryMeta({ updatedBy: historyResult.updatedBy, updatedAt: historyResult.updatedAt }); setPrevious(consultations.filter((item) => item.id !== result.id)); }
      }
    }).catch((reason: unknown) => { if (alive) setError(getErrorMessage(reason, 'Could not load the consultation.')); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [accept, consultationId, queueEntryId]);

  const setField = <K extends keyof ConsultationData>(key: K, value: ConsultationData[K]) => setData((current) => ({ ...current, [key]: value }));
  const updateRow = (key: RowKey, index: number, fieldName: string, value: string) => setData((current) => ({ ...current, [key]: (current[key] as Array<Record<string, unknown>>).map((row, rowIndex) => rowIndex === index ? { ...row, [fieldName]: ['affectedTeeth'].includes(fieldName) ? value.split(',').map((item) => item.trim()).filter(Boolean) : ['estimatedCost', 'numberOfSessions'].includes(fieldName) ? value === '' ? null : Number(value) : value } : row) } as ConsultationData));
  const addRow = (key: RowKey) => setData((current) => ({ ...current, [key]: [...current[key], key === 'dentalChart' ? { toothNumber: '', condition: '', affectedSurface: '', observations: '' } : key === 'diagnoses' ? { diagnosis: '', affectedTeeth: [], severity: '', remarks: '' } : key === 'treatmentPlan' ? { procedure: '', affectedTeeth: [], estimatedCost: null, numberOfSessions: null, instructions: '' } : { medicine: '', dosage: '', frequency: '', duration: '', instructions: '' }] } as ConsultationData));
  const removeRow = (key: RowKey, index: number) => setData((current) => ({ ...current, [key]: current[key].filter((_, i) => i !== index) } as ConsultationData));

  const save = async () => {
    if (!record) return;
    const prescriptionErrors = data.prescriptions.flatMap((prescription, index) => ([
      !prescription.medicine.trim() ? `Medicine is required for prescription ${index + 1}.` : '',
      !prescription.dosage.trim() ? `Dosage is required for ${prescription.medicine || `prescription ${index + 1}`}.` : '',
      !prescription.frequency.trim() ? `Frequency is required for ${prescription.medicine || `prescription ${index + 1}`}.` : '',
      !prescription.duration.trim() ? `Duration is required for ${prescription.medicine || `prescription ${index + 1}`}.` : '',
    ].filter(Boolean)));
    if (prescriptionErrors.length) { setError(prescriptionErrors.join(' ')); setNotice(''); setTab(6); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      if (record.patientUserId) {
        const result = await consultationService.updateHistory(record.patientUserId, history);
        setHistoryMeta({ updatedBy: result.updatedBy, updatedAt: result.updatedAt });
      }
      const updated = await consultationService.save(record.id, { data, medicalHistorySnapshot: history });
      accept(updated); setNotice('Consultation draft and prescriptions saved. Queue remains in consultation.');
    } catch (reason) { setError(getErrorMessage(reason, 'Could not save the consultation.')); }
    finally { setBusy(false); }
  };
  const finalize = async () => {
    if (!record || record.status === 'COMPLETED' || !window.confirm('Finalize this consultation and complete its queue entry? The clinical record will become historical and read-only.')) return;
    setBusy(true); setError(''); setNotice('');
    try { const updated = await consultationService.finalize(record.id); accept(updated); setNotice('Consultation finalized and queue entry completed.'); }
    catch (reason) { setError(getErrorMessage(reason, 'Could not finalize the consultation.')); }
    finally { setBusy(false); }
  };
  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file || !record) return;
    setBusy(true); setError('');
    try { accept(await consultationService.upload(record.id, file, (document.getElementById('attachment-category') as HTMLSelectElement).value)); setNotice('Attachment uploaded securely.'); }
    catch (reason) { setError(getErrorMessage(reason, 'Could not upload attachment.')); }
    finally { setBusy(false); event.target.value = ''; }
  };
  const attachmentAction = async (attachmentId: string, remove: boolean) => {
    if (!record) return;
    setBusy(true); setError('');
    try {
      if (remove) { await consultationService.removeAttachment(record.id, attachmentId); accept(await consultationService.get(record.id)); }
      else { const blob = await consultationService.download(record.id, attachmentId); const url = URL.createObjectURL(blob); window.open(url, '_blank', 'noopener,noreferrer'); window.setTimeout(() => URL.revokeObjectURL(url), 60_000); }
    } catch (reason) { setError(getErrorMessage(reason, 'Could not access the attachment.')); }
    finally { setBusy(false); }
  };

  const historyList = (key: 'existingConditions' | 'allergies' | 'medications' | 'previousSurgeries') => history[key].join('\n');
  const changeHistoryList = (key: 'existingConditions' | 'allergies' | 'medications' | 'previousSurgeries', value: string) => setHistory((current) => ({ ...current, [key]: value.split('\n').map((item) => item.trim()).filter(Boolean) }));
  const textarea = (title: string, value: string, onChange: (value: string) => void, placeholder = '') => <label className={label}>{title}<textarea className={area} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={record?.status === 'COMPLETED'} /></label>;
  const textInput = (title: string, value: string | number | null, onChange: (value: string) => void, type = 'text') => <label className={label}>{title}<Input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} disabled={record?.status === 'COMPLETED'} /></label>;

  const renderRows = (key: RowKey, fields: Array<{ key: string; label: string; type?: string; multiline?: boolean }>) => <div className="grid gap-3">{data[key].map((row, index) => <div key={`${key}-${index}`} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-2">{fields.map((field) => field.multiline ? <label key={field.key} className={`${label} sm:col-span-2`}>{field.label}<textarea className={area} value={String((row as unknown as Record<string, unknown>)[field.key] ?? '')} onChange={(e) => updateRow(key, index, field.key, e.target.value)} disabled={record?.status === 'COMPLETED'} /></label> : textInput(field.label, (row as unknown as Record<string, string | number | null>)[field.key] ?? '', (v) => updateRow(key, index, field.key, v), field.type))}{record?.status !== 'COMPLETED' ? <Button size="xs" variant="secondary" className="sm:col-span-2 sm:justify-self-end" onClick={() => removeRow(key, index)}>Remove row</Button> : null}</div>)}{record?.status !== 'COMPLETED' ? <Button variant="secondary" size="sm" className="justify-self-start" onClick={() => addRow(key)}>Add {key === 'dentalChart' ? 'tooth' : key === 'diagnoses' ? 'diagnosis' : key === 'treatmentPlan' ? 'procedure' : 'medicine'}</Button> : null}</div>;

  return <div className="grid gap-4">
    <Notices error={error} message={notice} />
    {loading ? <Card className="p-5 text-sm text-text-muted">Loading consultation…</Card> : null}
    {record ? <>
      <Card className="grid gap-4 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="m-0 text-lg font-semibold text-text-primary">{record.patientNameSnapshot}</h2><p className="mb-0 mt-1 text-sm text-text-muted">{record.appointmentId ? `Appointment · ${record.visitDetails.localDate}${record.visitDetails.localStartTime ? ` · ${record.visitDetails.localStartTime}–${record.visitDetails.localEndTime}` : ''}` : `Walk-in · ${record.visitDetails.localDate}`} · Started {new Date(record.startedAt).toLocaleString()}</p></div><span className="rounded-full bg-info-soft px-3 py-1.5 text-xs font-semibold text-info">{record.status.replace('_', ' ')}</span></div><StepTabs steps={tabs} active={tab} onSelect={setTab} /></Card>
      <ConsultationAIAssistance key={record.id} consultationId={record.id} patientAvailable={Boolean(record.patientUserId)} editable={record.status === 'IN_PROGRESS'} data={data} medicalHistory={history} />
      <Card className={panel}>
        {tab === 0 ? <><h2 className="m-0 text-base font-semibold">Patient Overview</h2><div className="grid gap-3 sm:grid-cols-2"><p className="m-0 text-sm"><strong>Patient:</strong> {record.patientNameSnapshot}</p><p className="m-0 text-sm"><strong>Visit:</strong> {record.appointmentId ? 'Appointment' : 'Guest walk-in'}</p><p className="m-0 text-sm"><strong>Clinic:</strong> {record.visitDetails.clinicName}</p><p className="m-0 text-sm"><strong>Visit date:</strong> {record.visitDetails.localDate}</p><p className="m-0 text-sm"><strong>Queue token:</strong> {record.visitDetails.tokenNumber}</p><p className="m-0 text-sm"><strong>Consultation:</strong> {record.status.replace('_', ' ')}</p></div><h3 className="m-0 mt-2 text-sm font-semibold">Previous consultations</h3>{record.patientUserId ? previous.length ? previous.map((item) => <article key={item.id} className="rounded-md border border-border p-3 text-sm"><strong>{new Date(item.startedAt).toLocaleString()}</strong><p className="mb-0 mt-1">{item.data.chiefComplaint || 'No chief complaint recorded'} · {item.status}</p></article>) : <p className="m-0 text-sm text-text-muted">No previous consultations for this patient in this clinic.</p> : <p className="m-0 text-sm text-text-muted">Guest records are linked through this queue entry; no patient account history is available.</p>}</> : null}
        {tab === 1 ? <><h2 className="m-0 text-base font-semibold">Medical History</h2>{record.patientUserId ? <p className="m-0 text-xs text-text-muted">Profile history is shared across visits. Saving records an immutable consultation snapshot. {historyMeta.updatedAt ? `Last updated ${new Date(historyMeta.updatedAt).toLocaleString()}.` : 'No previous history update recorded.'}</p> : <p className="m-0 text-xs text-text-muted">Guest history is kept on this consultation only.</p>}{(['existingConditions', 'allergies', 'medications', 'previousSurgeries'] as const).map((key) => textarea(({ existingConditions: 'Existing conditions', allergies: 'Allergies', medications: 'Medications', previousSurgeries: 'Previous surgeries' })[key], historyList(key), (v) => changeHistoryList(key, v), 'One item per line'))}{textarea('Dental history', history.dentalHistory, (v) => setHistory((h) => ({ ...h, dentalHistory: v })))}{textarea('Remarks', history.remarks, (v) => setHistory((h) => ({ ...h, remarks: v })))}</> : null}
        {tab === 2 ? <><h2 className="m-0 text-base font-semibold">Clinical Examination</h2>{textarea('Chief complaint', data.chiefComplaint, (v) => setField('chiefComplaint', v))}{textarea('Symptoms', data.symptoms.join('\n'), (v) => setField('symptoms', v.split('\n').map((s) => s.trim()).filter(Boolean)), 'One symptom per line')}<label className={label}>Pain level<Input type="number" min="0" max="10" value={data.painLevel ?? ''} onChange={(e) => setField('painLevel', e.target.value === '' ? null : Number(e.target.value))} disabled={record.status === 'COMPLETED'} /></label>{textarea('Examination findings', data.examinationFindings, (v) => setField('examinationFindings', v))}{textarea('Clinical notes', data.clinicalNotes, (v) => setField('clinicalNotes', v))}</> : null}
        {tab === 3 ? <><h2 className="m-0 text-base font-semibold">Dental Chart</h2><p className="m-0 text-sm text-text-muted">Record tooth numbers and surfaces using your clinic’s preferred notation.</p>{renderRows('dentalChart', [{ key: 'toothNumber', label: 'Tooth number' }, { key: 'condition', label: 'Condition' }, { key: 'affectedSurface', label: 'Affected surface' }, { key: 'observations', label: 'Observations', multiline: true }])}</> : null}
        {tab === 4 ? <><h2 className="m-0 text-base font-semibold">Diagnosis</h2>{renderRows('diagnoses', [{ key: 'diagnosis', label: 'Diagnosis' }, { key: 'affectedTeeth', label: 'Affected teeth (comma separated)' }, { key: 'severity', label: 'Severity' }, { key: 'remarks', label: 'Remarks', multiline: true }])}</> : null}
        {tab === 5 ? <><h2 className="m-0 text-base font-semibold">Treatment Plan</h2><p className="m-0 text-sm text-text-muted">Plans are stored independently and remain available after this consultation is finalized.</p></> : null}
        {tab === 6 ? <><h2 className="m-0 text-base font-semibold">Prescription</h2><p className="m-0 text-sm text-text-muted">Add one or more medicines. Medicine, dosage, frequency and duration are required. Prescriptions become historical when the consultation is finalized.</p>{renderRows('prescriptions', [{ key: 'medicine', label: 'Medicine *' }, { key: 'dosage', label: 'Dosage *' }, { key: 'frequency', label: 'Frequency *' }, { key: 'duration', label: 'Duration *' }, { key: 'instructions', label: 'Instructions', multiline: true }])}</> : null}
        {tab === 7 ? <><h2 className="m-0 text-base font-semibold">Attachments</h2><p className="m-0 text-sm text-text-muted">Private files are available only through authorized clinician access. PDF, JPEG and PNG, up to 10 MB.</p>{record.attachments.map((a) => <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm"><span>{a.fileName} · {a.category.replaceAll('_', ' ')} · {new Date(a.uploadedAt).toLocaleDateString()}</span><div className="flex gap-2"><Button size="xs" variant="secondary" onClick={() => void attachmentAction(a.id, false)}>Open</Button>{record.status === 'IN_PROGRESS' ? <Button size="xs" variant="secondary" disabled={busy} onClick={() => void attachmentAction(a.id, true)}>Remove</Button> : null}</div></div>)}{record.status === 'IN_PROGRESS' ? <div className="grid gap-2 sm:grid-cols-[1fr_2fr]"><label className={label}>Category<select id="attachment-category" className={area}><option value="X_RAY">X-rays</option><option value="CLINICAL_PHOTOGRAPH">Clinical photographs</option><option value="REPORT">Reports</option><option value="SUPPORTING_DOCUMENT">Supporting documents</option></select></label><label className={label}>Choose attachment<input type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => void upload(e)} disabled={busy} /></label></div> : null}</> : null}
      </Card>
      {record ? <ConsultationFollowUpsPlans consultationId={record.id} editable /> : null}
      <div className="flex flex-wrap justify-between gap-2"><Button variant="secondary" onClick={() => navigate('/doctor/queue')}>Back to queue</Button><div className="flex flex-wrap gap-2">{record.status === 'IN_PROGRESS' ? <><Button variant="secondary" disabled={busy} onClick={() => void save()}>{busy ? 'Saving…' : 'Save draft'}</Button><Button disabled={busy} onClick={() => void finalize()}>{busy ? 'Working…' : 'Finalize consultation'}</Button></> : <p className="m-0 self-center text-sm font-medium text-success">Completed historical record · read only</p>}</div></div>
    </> : null}
  </div>;
}
