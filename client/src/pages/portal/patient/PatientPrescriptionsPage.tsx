import { useEffect, useState } from 'react';
import { Card } from '@/components/atoms/Card';
import { Notice } from '@/components/atoms/Notice';
import { EmptyState } from '@/components/molecules/EmptyState';
import { PageHeading } from '@/components/molecules/PageHeading';
import { SectionHeading } from '@/components/molecules/SectionHeading';
import { appointmentService, type PatientPrescription } from '@/features/patient/services/appointmentService';
import { getErrorMessage } from '@/shared/lib/http';
import { Button } from '@/components/atoms/Button';

export default function PatientPrescriptionsPage() {
  const [items, setItems] = useState<PatientPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);
  const download = async (consultationId: string) => {
    setDownloading(consultationId);
    try {
      const pdf = await appointmentService.downloadPrescriptionPdf(consultationId);
      const url = URL.createObjectURL(pdf);
      const link = document.createElement('a'); link.href = url; link.download = `prescription-${consultationId}.pdf`; link.click();
      URL.revokeObjectURL(url);
    } catch (reason) { setError(getErrorMessage(reason, 'Could not download this prescription.')); }
    finally { setDownloading(null); }
  };
  useEffect(() => {
    let active = true;
    void appointmentService.listPrescriptions().then((result) => { if (active) setItems(result); }).catch((reason: unknown) => { if (active) setError(getErrorMessage(reason, 'Could not load your prescriptions.')); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="grid gap-4">
    <div><PageHeading eyebrow="YOUR CARE RECORDS" title="Prescriptions" /><p className="-mt-4 mb-1 text-sm text-text-muted">Prescriptions from completed consultations. These clinical records are read-only.</p></div>
    {error ? <Notice tone="error">{error}</Notice> : null}
    {loading ? <Card className="p-5 text-sm text-text-muted">Loading prescriptions…</Card> : null}
    {!loading && !error && items.length === 0 ? <Card><EmptyState><p className="m-0 font-semibold text-text-secondary">No prescriptions yet</p><p className="mb-0 mt-1">Prescriptions from completed consultations will appear here.</p></EmptyState></Card> : null}
    {items.map((item) => <Card key={item.consultationId} className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 p-4 pb-0"><SectionHeading title={`${item.doctorName} · ${item.clinicName}`} description={`Prescribed ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(item.prescribedAt))}`} /><Button variant="secondary" size="sm" disabled={downloading === item.consultationId} onClick={() => void download(item.consultationId)}>{downloading === item.consultationId ? 'Preparing PDF…' : 'Download PDF'}</Button></div>
      <div className="grid gap-3 p-4 sm:p-5">
        {item.prescriptions.map((prescription, index) => <article key={`${item.consultationId}-${index}`} className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
          <h3 className="m-0 text-base font-semibold text-text-primary sm:col-span-2">{prescription.medicine}</h3>
          <p className="m-0 text-sm"><strong>Dosage:</strong> {prescription.dosage}</p>
          <p className="m-0 text-sm"><strong>Frequency:</strong> {prescription.frequency}</p>
          <p className="m-0 text-sm"><strong>Duration:</strong> {prescription.duration}</p>
          {prescription.instructions ? <p className="m-0 text-sm sm:col-span-2"><strong>Instructions:</strong> {prescription.instructions}</p> : null}
        </article>)}
      </div>
    </Card>)}
  </div>;
}
