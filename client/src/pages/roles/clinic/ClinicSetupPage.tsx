import { useEffect, useState, type FormEvent } from 'react';
import { apiRequest } from '../../../lib/api';

type WorkingHour = { day: string; isOpen: boolean; startTime: string; endTime: string };
type ClinicDocument = { documentType: string; documentKey: string; uploadedAt: string };
type ClinicProfile = {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  phone: string | null;
  ownerName: string | null;
  contactEmail: string | null;
  registrationNumber: string | null;
  clinicType: string | null;
  specializations: string[];
  workingHours: WorkingHour[];
  documents: ClinicDocument[];
};

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const defaultHours = days.map((day, index) => ({ day, isOpen: index < 5, startTime: '09:00', endTime: '17:00' }));
const emptyProfile: ClinicProfile = {
  id: '', name: '', description: '', address: '', city: '', state: '', pincode: '', phone: '',
  ownerName: '', contactEmail: '', registrationNumber: '', clinicType: '', specializations: [],
  workingHours: defaultHours, documents: [],
};

export function ClinicSetupPage({ accessToken }: { accessToken: string | null }) {
  const [clinic, setClinic] = useState<ClinicProfile>(emptyProfile);
  const [specializationsText, setSpecializationsText] = useState('');
  const [documentType, setDocumentType] = useState('Clinic registration');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!accessToken) return;
    apiRequest<ClinicProfile>('/clinic/profile', {}, accessToken)
      .then((profile) => {
        setClinic({ ...emptyProfile, ...profile, workingHours: profile.workingHours?.length ? profile.workingHours : defaultHours });
        setSpecializationsText((profile.specializations ?? []).join(', '));
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Could not load clinic setup.'));
  }, [accessToken]);

  function updateField(field: keyof ClinicProfile, value: string) {
    setClinic((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!clinic.name.trim() || clinic.name.trim().length < 2) {
      setError('Clinic name must be at least 2 characters long.');
      return;
    }
    if (!clinic.contactEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clinic.contactEmail)) {
      setError('Enter a valid clinic contact email address.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    try {
      const updated = await apiRequest<ClinicProfile>('/clinic/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: clinic.name.trim(), description: clinic.description?.trim(), address: clinic.address?.trim(),
          city: clinic.city?.trim(), state: clinic.state?.trim(), pincode: clinic.pincode?.trim(),
          phone: clinic.phone?.trim(), contactEmail: clinic.contactEmail.trim().toLowerCase(),
          registrationNumber: clinic.registrationNumber?.trim(), clinicType: clinic.clinicType?.trim(),
        }),
      }, accessToken ?? undefined);
      setClinic((current) => ({ ...current, ...updated }));
      setMessage('Clinic profile saved.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save the clinic profile.'); }
    finally { setBusy(false); }
  }

  async function saveSpecializations(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const specializations = [...new Set(specializationsText.split(',').map((value) => value.trim()).filter(Boolean))];
    setBusy(true); setError(''); setMessage('');
    try {
      const saved = await apiRequest<string[]>('/clinic/specializations', {
        method: 'PUT', body: JSON.stringify({ specializations }),
      }, accessToken ?? undefined);
      setClinic((current) => ({ ...current, specializations: saved }));
      setSpecializationsText(saved.join(', '));
      setMessage('Clinic specializations saved.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save specializations.'); }
    finally { setBusy(false); }
  }

  async function saveHours(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const invalid = clinic.workingHours.find((hours) => hours.isOpen && hours.startTime >= hours.endTime);
    if (invalid) { setError(`${invalid.day}: closing time must be later than opening time.`); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const saved = await apiRequest<WorkingHour[]>('/clinic/working-hours', {
        method: 'PUT', body: JSON.stringify({ workingHours: clinic.workingHours }),
      }, accessToken ?? undefined);
      setClinic((current) => ({ ...current, workingHours: saved }));
      setMessage('Clinic working hours saved.');
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Could not save working hours.'); }
    finally { setBusy(false); }
  }

  async function uploadDocument(file: File | undefined) {
    if (!file) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const upload = await apiRequest<{ key: string; uploadUrl: string }>('/clinic/documents/upload-url', {
        method: 'POST', body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
      }, accessToken ?? undefined);
      const response = await fetch(upload.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!response.ok) throw new Error('The file could not be uploaded to secure storage. Try again.');
      const documents = await apiRequest<ClinicDocument[]>('/clinic/documents', {
        method: 'POST', body: JSON.stringify({ documentType, documentKey: upload.key }),
      }, accessToken ?? undefined);
      setClinic((current) => ({ ...current, documents }));
      setMessage(`${documentType} uploaded and saved.`);
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : 'Could not upload this document.'); }
    finally { setBusy(false); }
  }

  async function openDocument(type: string) {
    setError('');
    try {
      const result = await apiRequest<{ url: string }>(`/clinic/documents/${encodeURIComponent(type)}/download-url`, {}, accessToken ?? undefined);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (downloadError) { setError(downloadError instanceof Error ? downloadError.message : 'Could not open the document.'); }
  }

  return (
    <div className="clinic-setup">
      {error ? <div className="notice notice-error" role="alert">{error}</div> : null}
      {message ? <div className="notice notice-success" role="status">{message}</div> : null}
      <section className="form-section">
        <div className="section-heading"><div><h2>Clinic profile</h2><p>Keep your practice details accurate for your team and patients.</p></div></div>
        <form className="portal-form profile-form" onSubmit={saveProfile}>
          <label>Clinic name<input value={clinic.name} onChange={(event) => updateField('name', event.target.value)} minLength={2} maxLength={150} required /></label>
          <label>Clinic type<input value={clinic.clinicType ?? ''} onChange={(event) => updateField('clinicType', event.target.value)} placeholder="Dental clinic" /></label>
          <label>Contact email<input type="email" value={clinic.contactEmail ?? ''} onChange={(event) => updateField('contactEmail', event.target.value)} required /></label>
          <label>Phone<input type="tel" value={clinic.phone ?? ''} onChange={(event) => updateField('phone', event.target.value)} pattern="[+0-9 ()-]{7,20}" title="Enter a valid phone number." /></label>
          <label>Registration number<input value={clinic.registrationNumber ?? ''} onChange={(event) => updateField('registrationNumber', event.target.value)} /></label>
          <label>Address<input value={clinic.address ?? ''} onChange={(event) => updateField('address', event.target.value)} /></label>
          <label>City<input value={clinic.city ?? ''} onChange={(event) => updateField('city', event.target.value)} /></label>
          <label>State<input value={clinic.state ?? ''} onChange={(event) => updateField('state', event.target.value)} /></label>
          <label>Postal code<input value={clinic.pincode ?? ''} onChange={(event) => updateField('pincode', event.target.value)} pattern="[A-Za-z0-9 -]{3,12}" title="Enter a valid postal code." /></label>
          <label>About the clinic<input value={clinic.description ?? ''} onChange={(event) => updateField('description', event.target.value)} maxLength={500} /></label>
          <button className="button button-primary" disabled={busy}>{busy ? 'Saving...' : 'Save clinic profile'}</button>
        </form>
      </section>

      <section className="form-section">
        <div className="section-heading"><div><h2>Specializations</h2><p>List the services your clinic provides.</p></div></div>
        <form className="portal-form inline-form" onSubmit={saveSpecializations}>
          <label>Specializations, separated by commas<input value={specializationsText} onChange={(event) => setSpecializationsText(event.target.value)} placeholder="General dentistry, Orthodontics" /></label>
          <button className="button button-primary" disabled={busy}>{busy ? 'Saving...' : 'Save specializations'}</button>
        </form>
      </section>

      <section className="form-section">
        <div className="section-heading"><div><h2>Working hours</h2><p>Set the hours patients can contact your clinic.</p></div></div>
        <form className="portal-form" onSubmit={saveHours}>
          <div className="hours-list">{clinic.workingHours.map((hours, index) => <div className="hours-row" key={hours.day}>
            <label className="remember-option"><input type="checkbox" checked={hours.isOpen} onChange={(event) => setClinic((current) => ({ ...current, workingHours: current.workingHours.map((item, itemIndex) => itemIndex === index ? { ...item, isOpen: event.target.checked } : item) }))} /><span>{hours.day}</span></label>
            <label>Opens<input type="time" value={hours.startTime} disabled={!hours.isOpen} onChange={(event) => setClinic((current) => ({ ...current, workingHours: current.workingHours.map((item, itemIndex) => itemIndex === index ? { ...item, startTime: event.target.value } : item) }))} /></label>
            <label>Closes<input type="time" value={hours.endTime} disabled={!hours.isOpen} onChange={(event) => setClinic((current) => ({ ...current, workingHours: current.workingHours.map((item, itemIndex) => itemIndex === index ? { ...item, endTime: event.target.value } : item) }))} /></label>
          </div>)}</div>
          <button className="button button-primary" disabled={busy}>{busy ? 'Saving...' : 'Save working hours'}</button>
        </form>
      </section>

      <section className="form-section">
        <div className="section-heading"><div><h2>Clinic documents</h2><p>Private PDF, JPG, or PNG files up to 10 MB.</p></div></div>
        <div className="portal-form inline-form">
          <label>Document type<select value={documentType} onChange={(event) => setDocumentType(event.target.value)}><option>Clinic registration</option><option>Operating license</option><option>Insurance certificate</option><option>Other</option></select></label>
          <label>Upload document<input type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} onChange={(event) => { void uploadDocument(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label>
        </div>
        <ul className="document-list">{clinic.documents.map((document) => <li key={document.documentType}><span>{document.documentType}</span><button type="button" className="text-link" onClick={() => void openDocument(document.documentType)}>Open document</button></li>)}</ul>
      </section>
    </div>
  );
}