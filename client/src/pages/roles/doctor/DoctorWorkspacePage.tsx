import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../../../lib/api';

type WorkingHour = { day: string; isOpen: boolean; startTime: string; endTime: string };
type DoctorDocument = { documentType: string; documentUrl: string; status: string; uploadedAt: string; rejectionReason?: string | null };
type DoctorProfile = {
  firstName: string; lastName: string; phone: string | null; gender: string | null; dateOfBirth: string | null;
  professionalTitle: string | null; qualification: string | null; yearsOfExperience: number | null;
  registrationNumber: string | null; registrationAuthority: string | null; bio: string | null;
  specializations: string[]; procedures: string[]; workingHours: WorkingHour[]; consultationFee: number | null;
  slotDuration: number; bufferMinutes: number; verificationStatus: string; onboardingProgress: number;
  documents: DoctorDocument[]; rejectionReason: string | null;
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const defaultHours = days.map((day, index) => ({ day, isOpen: index < 5, startTime: '09:00', endTime: '17:00' }));
const onboardingSteps = ['Professional details', 'Documents', 'Working hours', 'Availability', 'Review'];
const emptyProfile: DoctorProfile = {
  firstName: '', lastName: '', phone: '', gender: '', dateOfBirth: '', professionalTitle: '', qualification: '',
  yearsOfExperience: null, registrationNumber: '', registrationAuthority: '', bio: '', specializations: [],
  procedures: [], workingHours: defaultHours, consultationFee: null, slotDuration: 30, bufferMinutes: 10,
  verificationStatus: 'NOT_STARTED', onboardingProgress: 0, documents: [], rejectionReason: null,
};

function findResumeStep(profile: DoctorProfile): number {
  if (profile.verificationStatus === 'PENDING_VERIFICATION' || profile.verificationStatus === 'VERIFIED') return 4;
  if (!profile.firstName || !profile.lastName || !profile.phone || !profile.professionalTitle || !profile.qualification || !profile.registrationNumber || !profile.specializations.length || !profile.procedures.length) return 0;
  if (profile.documents.length < 3) return 1;
  if (!profile.workingHours.some((hours) => hours.isOpen)) return 2;
  return 3;
}

export function DoctorWorkspacePage({ accessToken }: { accessToken: string | null }) {
  const [profile, setProfile] = useState<DoctorProfile>(emptyProfile);
  const [specializationsText, setSpecializationsText] = useState('');
  const [proceduresText, setProceduresText] = useState('');
  const [documentType, setDocumentType] = useState('Professional license');
  const [activeStep, setActiveStep] = useState(0);
  const [generatedSlots, setGeneratedSlots] = useState<Array<{ day: string; startTime: string; endTime: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    Promise.all([
      apiRequest<DoctorProfile>('/doctor/profile', {}, accessToken),
      apiRequest<{ slotDuration: number; bufferMinutes: number; consultationFee: number | null }>('/doctor/slot-config', {}, accessToken),
    ]).then(([saved, config]) => {
      const loaded = { ...emptyProfile, ...saved, ...config, workingHours: saved.workingHours?.length ? saved.workingHours : defaultHours };
      setProfile(loaded);
      setActiveStep(findResumeStep(loaded));
      setSpecializationsText((loaded.specializations ?? []).join(', '));
      setProceduresText((loaded.procedures ?? []).join(', '));
    }).catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Could not load your Doctor profile.'));
  }, [accessToken]);

  function updateField(field: keyof DoctorProfile, value: string | number | null) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveProfessionalInfo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (profile.phone && !/^\+?[0-9 ()-]{7,20}$/.test(profile.phone)) {
      setError('Enter a valid phone number, including country code if needed.');
      return;
    }
    const parseList = (value: string) => [...new Set(value.split(',').map((item) => item.trim()).filter(Boolean))];
    setBusy(true); setError(''); setMessage('');
    try {
      const saved = await apiRequest<DoctorProfile>('/doctor/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          ...profile,
          yearsOfExperience: profile.yearsOfExperience === null ? null : Number(profile.yearsOfExperience),
          specializations: parseList(specializationsText), procedures: parseList(proceduresText),
        }),
      }, accessToken ?? undefined);
      setProfile((current) => ({ ...current, ...saved }));
      setMessage('Professional profile saved.');
      setActiveStep(1);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save your profile.'); }
    finally { setBusy(false); }
  }

  async function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = profile.workingHours.find((hours) => hours.isOpen && hours.startTime >= hours.endTime);
    if (invalid) { setError(`${invalid.day}: closing time must be later than opening time.`); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const saved = await apiRequest<DoctorProfile>('/doctor/availability', {
        method: 'PUT', body: JSON.stringify({ workingHours: profile.workingHours }),
      }, accessToken ?? undefined);
      setProfile((current) => ({ ...current, ...saved }));
      setMessage('Working hours saved.');
      setActiveStep(3);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save working hours.'); }
    finally { setBusy(false); }
  }

  async function saveSlotConfig(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const config = await apiRequest<{ slotDuration: number; bufferMinutes: number; consultationFee: number | null }>('/doctor/slot-config', {
        method: 'PUT', body: JSON.stringify({ slotDuration: profile.slotDuration, bufferMinutes: profile.bufferMinutes }),
      }, accessToken ?? undefined);
      setProfile((current) => ({ ...current, ...config }));
      setMessage('Availability settings saved.');
      setActiveStep(4);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save availability settings.'); }
    finally { setBusy(false); }
  }

  async function uploadDocument(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const upload = await apiRequest<{ key: string; uploadUrl: string }>('/doctor/documents/upload-url', {
        method: 'POST', body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
      }, accessToken ?? undefined);
      const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!response.ok) throw new Error('The file could not be uploaded to secure storage. Try again.');
      const saved = await apiRequest<DoctorProfile>('/doctor/documents', {
        method: 'POST', body: JSON.stringify({ documentType, documentKey: upload.key }),
      }, accessToken ?? undefined);
      setProfile((current) => ({ ...current, ...saved }));
      setMessage(`${documentType} uploaded and saved.`);
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Could not upload this document.'); }
    finally { setBusy(false); }
  }

  async function openDocument(type: string) {
    try {
      const result = await apiRequest<{ url: string }>(`/doctor/documents/${encodeURIComponent(type)}/download-url`, {}, accessToken ?? undefined);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (downloadError) { setError(downloadError instanceof Error ? downloadError.message : 'Could not open this document.'); }
  }

  async function submitForReview() {
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await apiRequest<{ verificationStatus: string }>('/doctor/submit-verification', { method: 'POST' }, accessToken ?? undefined);
      setProfile((current) => ({ ...current, verificationStatus: result.verificationStatus, onboardingProgress: 100, rejectionReason: null }));
      setMessage('Your profile has been submitted to your Clinic Admin for review.');
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not submit your profile.'); }
    finally { setBusy(false); }
  }

  async function generateAvailability() {
    setBusy(true); setError(''); setMessage('');
    try {
      const slots = await apiRequest<Array<{ day: string; startTime: string; endTime: string }>>('/doctor/generate-slots', { method: 'POST' }, accessToken ?? undefined);
      setGeneratedSlots(slots);
      setMessage(`${slots.length} availability slots generated from your working hours.`);
    } catch (slotError) { setError(slotError instanceof Error ? slotError.message : 'Could not generate availability.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="doctor-workspace">
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      {message ? <div className="notice notice-success" role="status">{message}</div> : null}
      {profile.verificationStatus === 'REJECTED' && profile.rejectionReason ? <div className="notice notice-error"><strong>Changes requested</strong><p>{profile.rejectionReason}</p></div> : null}
      <div className="welcome-band"><div><span className="status-pill">{profile.verificationStatus.replaceAll('_', ' ')}</span><h2>Profile completion: {profile.onboardingProgress}%</h2><p>Complete each step, then send your profile to the Clinic Admin for review.</p></div></div>
      <nav className="doctor-onboarding-steps" aria-label="Doctor onboarding steps">{onboardingSteps.map((step, index) => <button type="button" key={step} className={activeStep === index ? 'active' : ''} aria-current={activeStep === index ? 'step' : undefined} onClick={() => setActiveStep(index)}><span>0{index + 1}</span>{step}</button>)}</nav>

      {activeStep === 0 ? <section className="form-section" id="professional-details">
        <div className="section-heading"><div><h2>Professional information</h2><p>These details appear in your Clinic workspace.</p></div></div>
        <form className="portal-form profile-form" onSubmit={saveProfessionalInfo}>
          <label>First name<input value={profile.firstName} onChange={(event) => updateField('firstName', event.target.value)} minLength={2} required /></label>
          <label>Last name<input value={profile.lastName} onChange={(event) => updateField('lastName', event.target.value)} minLength={2} required /></label>
          <label>Phone<input type="tel" value={profile.phone ?? ''} onChange={(event) => updateField('phone', event.target.value)} pattern="\+?[0-9 ()-]{7,20}" required /></label>
          <label>Professional title<input value={profile.professionalTitle ?? ''} onChange={(event) => updateField('professionalTitle', event.target.value)} required /></label>
          <label>Qualification<input value={profile.qualification ?? ''} onChange={(event) => updateField('qualification', event.target.value)} required /></label>
          <label>Years of experience<input type="number" min="0" max="70" value={profile.yearsOfExperience ?? ''} onChange={(event) => updateField('yearsOfExperience', event.target.value === '' ? null : Number(event.target.value))} /></label>
          <label>Registration number<input value={profile.registrationNumber ?? ''} onChange={(event) => updateField('registrationNumber', event.target.value)} required /></label>
          <label>Registration authority<input value={profile.registrationAuthority ?? ''} onChange={(event) => updateField('registrationAuthority', event.target.value)} /></label>
          <label>Specializations<input value={specializationsText} onChange={(event) => setSpecializationsText(event.target.value)} placeholder="Orthodontics, Endodontics" required /></label>
          <label>Procedures<input value={proceduresText} onChange={(event) => setProceduresText(event.target.value)} placeholder="Root canal, Dental crowns" required /></label>
          <label>Professional bio<input value={profile.bio ?? ''} onChange={(event) => updateField('bio', event.target.value)} maxLength={1200} /></label>
          <button className="button button-primary" disabled={busy}>{busy ? 'Saving...' : 'Save and continue'}</button>
        </form>
      </section> : null}

      {activeStep === 1 ? <section className="form-section" id="professional-documents">
        <div className="section-heading"><div><h2>Professional documents</h2><p>Upload at least three PDF, JPG, or PNG files up to 10 MB each.</p></div></div>
        <div className="portal-form inline-form">
          <label>Document type<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option>Professional license</option><option>Qualification certificate</option><option>Identity document</option><option>Additional certificate</option></select></label>
          <label>Upload document<input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={(event) => { void uploadDocument(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label>
        </div>
        <ul className="document-list">{profile.documents.map((document) => <li key={document.documentType}><span>{document.documentType} <small>{document.status}</small></span><button type="button" className="text-link" onClick={() => void openDocument(document.documentType)}>Open document</button></li>)}</ul>
        <div className="onboarding-step-actions"><button type="button" className="button button-secondary" onClick={() => setActiveStep(0)}>Back</button><button type="button" className="button button-primary" onClick={() => setActiveStep(2)}>Continue to working hours</button></div>
      </section> : null}

      {activeStep === 2 ? <section className="form-section" id="working-hours">
        <div className="section-heading"><div><h2>Working hours</h2><p>Set the hours used to generate your availability.</p></div></div>
        <form className="portal-form" onSubmit={saveHours}>
          <div className="hours-list">{profile.workingHours.map((hours, index) => <div className="hours-row" key={hours.day}>
            <label className="remember-option"><input type="checkbox" checked={hours.isOpen} onChange={(event) => setProfile((current) => ({ ...current, workingHours: current.workingHours.map((item, itemIndex) => itemIndex === index ? { ...item, isOpen: event.target.checked } : item) }))} /><span>{hours.day}</span></label>
            <label>Starts<input type="time" value={hours.startTime} disabled={!hours.isOpen} onChange={(event) => setProfile((current) => ({ ...current, workingHours: current.workingHours.map((item, itemIndex) => itemIndex === index ? { ...item, startTime: event.target.value } : item) }))} /></label>
            <label>Ends<input type="time" value={hours.endTime} disabled={!hours.isOpen} onChange={(event) => setProfile((current) => ({ ...current, workingHours: current.workingHours.map((item, itemIndex) => itemIndex === index ? { ...item, endTime: event.target.value } : item) }))} /></label>
          </div>)}</div>
          <button className="button button-primary" disabled={busy}>{busy ? 'Saving...' : 'Save and continue'}</button>
        </form>
        <div className="onboarding-step-actions"><button type="button" className="button button-secondary" disabled={busy} onClick={() => setActiveStep(1)}>Back</button></div>
      </section> : null}

      {activeStep === 3 ? <section className="form-section" id="availability">
        <div className="section-heading"><div><h2>Availability</h2><p>Clinic Admin-configured consultation fee: <strong>{profile.consultationFee == null ? 'Not set yet' : profile.consultationFee}</strong></p></div></div>
        <form className="portal-form inline-form" onSubmit={saveSlotConfig}>
          <label>Slot duration (minutes)<input type="number" min="5" max="180" step="1" value={profile.slotDuration} onChange={(event) => updateField('slotDuration', Number(event.target.value))} required /></label>
          <label>Buffer between slots (minutes)<input type="number" min="0" max="120" step="1" value={profile.bufferMinutes} onChange={(event) => updateField('bufferMinutes', Number(event.target.value))} required /></label>
          <button className="button button-secondary" disabled={busy}>{busy ? 'Saving...' : 'Save slot settings'}</button>
        </form>
        <button className="button button-primary" disabled={busy} onClick={() => void generateAvailability()}>{busy ? 'Working...' : 'Generate availability'}</button>
        {generatedSlots.length ? <ul className="slot-list">{generatedSlots.map((slot, index) => <li key={`${slot.day}-${slot.startTime}-${index}`}><span>{slot.day}</span><strong>{slot.startTime}–{slot.endTime}</strong></li>)}</ul> : null}
        <div className="onboarding-step-actions"><button type="button" className="button button-secondary" disabled={busy} onClick={() => setActiveStep(2)}>Back</button></div>
      </section> : null}
      {activeStep === 4 ? <section className="form-section" id="review"><div className="section-heading"><div><h2>Review and submit</h2><p>Current status: <strong>{profile.verificationStatus.replaceAll('_', ' ')}</strong>. Your Clinic Admin will review your professional profile and documents.</p></div></div><div className="review-summary"><span>Professional details</span><strong>{profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : 'Incomplete'}</strong><span>Documents</span><strong>{profile.documents.length} uploaded</strong><span>Specializations</span><strong>{profile.specializations.join(', ') || 'Incomplete'}</strong><span>Working days</span><strong>{profile.workingHours.filter((hours) => hours.isOpen).length}</strong><span>Consultation fee</span><strong>{profile.consultationFee == null ? 'Not set by clinic' : profile.consultationFee}</strong></div><div className="onboarding-step-actions"><button type="button" className="button button-secondary" onClick={() => setActiveStep(3)}>Back</button><button className="button button-primary" disabled={busy || profile.verificationStatus === 'PENDING_VERIFICATION' || profile.verificationStatus === 'VERIFIED'} onClick={() => void submitForReview()}>{busy ? 'Submitting...' : 'Submit for review'}</button></div></section> : null}
    </div>
  );
}