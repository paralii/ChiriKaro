import { useState } from 'react';
import { FileInput } from '@/components/atoms/FileInput';
import { Select } from '@/components/atoms/Select';
import { FormField } from '@/components/molecules/FormField';
import { DocumentList } from '@/components/molecules/DocumentList';

export function DocumentUploader({ types, documents, busy, showStatus, onUpload, onOpen }: {
  types: string[];
  documents: { documentType: string; status?: string }[];
  busy: boolean;
  showStatus?: boolean;
  onUpload: (type: string, file: File) => void;
  onOpen: (type: string) => void;
}) {
  const [type, setType] = useState(types[0]);
  return (
    <>
      <div className="grid grid-cols-[1fr_auto] items-end gap-4 p-[19px] max-md:grid-cols-1">
        <FormField label="Document type"><Select value={type} onChange={(e) => setType(e.target.value)}>{types.map((t) => <option key={t}>{t}</option>)}</Select></FormField>
        <FormField label="Upload document">
          <FileInput accept="application/pdf,image/jpeg,image/png" disabled={busy}
            onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(type, file); e.currentTarget.value = ''; }} />
        </FormField>
      </div>
      <DocumentList items={documents.map((d) => ({ key: d.documentType, label: d.documentType, status: showStatus ? d.status : undefined }))} onOpen={onOpen} />
    </>
  );
}