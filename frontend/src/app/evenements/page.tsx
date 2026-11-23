'use client';

import { useState, type FormEvent } from 'react';
import { createExternalEvent, uploadExternalEventFile, type ExternalEvent } from '@/lib/api';
import EventDeclarationForm, { type EventFormFile } from '@/components/events/EventDeclarationForm';
import EventDeclarationSuccess from '@/components/events/EventDeclarationSuccess';

export default function EvenementsPage() {
  const [form, setForm] = useState({
    title: '', eventType: '', description: '', startDate: '', startTime: '',
    endDate: '', endTime: '', location: '', contactName: '', contactEmail: '', contactPhone: '',
  });
  const [files, setFiles] = useState<EventFormFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEvent, setSuccessEvent] = useState<ExternalEvent | null>(null);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFileAdd(selectedFiles: FileList | File[]) {
    setError(null);
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const newFiles: EventFormFile[] = [];
    Array.from(selectedFiles).forEach((file) => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      if (!validExtensions.includes(extension)) {
        setError(`Le fichier « ${file.name} » n'est pas autorisé. Formats acceptés : PDF, PNG, JPG, JPEG.`);
      } else if (file.size > 10 * 1024 * 1024) {
        setError(`Le fichier « ${file.name} » dépasse la taille maximale de 10 Mo.`);
      } else {
        newFiles.push({ id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`, file, name: file.name, size: file.size });
      }
    });
    setFiles((current) => [...current, ...newFiles]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const requiredFields: Array<[keyof typeof form, string]> = [
      ['title', 'Veuillez renseigner le nom de l’événement.'],
      ['eventType', 'Veuillez sélectionner un type d’événement.'],
      ['location', 'Veuillez renseigner le lieu de l’événement.'],
      ['contactName', 'Veuillez renseigner l’ensemble des informations du contact référent.'],
      ['contactEmail', 'Veuillez renseigner l’ensemble des informations du contact référent.'],
      ['contactPhone', 'Veuillez renseigner l’ensemble des informations du contact référent.'],
    ];
    const missing = requiredFields.find(([field]) => !form[field].trim());
    if (missing) { setError(missing[1]); return; }
    if (!form.startDate || !form.startTime || !form.endDate || !form.endTime) {
      setError('Veuillez renseigner les dates et horaires de début et de fin.'); return;
    }
    const start = new Date(`${form.startDate}T${form.startTime}:00`);
    const end = new Date(`${form.endDate}T${form.endTime}:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setError('La date et l’heure de fin doivent être postérieures à la date et l’heure de début.'); return;
    }
    setIsSubmitting(true);
    try {
      const created = await createExternalEvent({
        title: form.title.trim(), location: form.location.trim(), event_type: form.eventType,
        start_date: start.toISOString(), end_time: end.toISOString(),
      });
      const uploaded = [];
      for (const formFile of files) {
        try { uploaded.push(await uploadExternalEventFile(created.id, formFile.file)); }
        catch (uploadError) { console.error(`Erreur upload ${formFile.name}:`, uploadError); }
      }
      const completeEvent: ExternalEvent = {
        ...created, description: form.description.trim() || undefined,
        contact_nom: form.contactName.trim(), contact_email: form.contactEmail.trim(),
        contact_telephone: form.contactPhone.trim(),
        files: uploaded.map((file) => ({ id: file.id, original_name: file.original_name, file_type: file.file_type, mime_type: file.mime_type, file_size: file.file_size })),
      };
      try {
        const stored = JSON.parse(localStorage.getItem('feytiat_demarches_events') || '[]');
        stored.unshift(completeEvent);
        localStorage.setItem('feytiat_demarches_events', JSON.stringify(stored));
      } catch { /* Le stockage local est facultatif. */ }
      setSuccessEvent(completeEvent);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Une erreur inattendue est survenue lors de l’enregistrement de votre déclaration.');
    } finally { setIsSubmitting(false); }
  }

  function handleReset() {
    setForm({ title: '', eventType: '', description: '', startDate: '', startTime: '', endDate: '', endTime: '', location: '', contactName: '', contactEmail: '', contactPhone: '' });
    setFiles([]); setError(null); setSuccessEvent(null);
  }

  return (
    <main className="min-h-screen bg-white px-6 py-8 sm:px-10 lg:px-14 lg:py-10">
      <div className="mx-auto max-w-328">
        <header className="rounded-card bg-primary-soft px-6 py-6 sm:px-8 sm:py-7"><p className="text-label font-bold uppercase tracking-eyebrow text-primary">Espace associations · Organiser</p><h1 className="mt-2 text-4xl font-black tracking-display text-ink">Déclarer un évènement</h1><p className="mt-1 text-sm text-muted">Informez la mairie de votre évènement et transmettez les documents utiles.</p></header>
        {successEvent ? <EventDeclarationSuccess event={successEvent} onReset={handleReset} /> : <EventDeclarationForm {...form} files={files} isDragging={isDragging} isSubmitting={isSubmitting} error={error} onTitleChange={(value) => updateField('title', value)} onEventTypeChange={(value) => updateField('eventType', value)} onDescriptionChange={(value) => updateField('description', value)} onStartDateChange={(value) => updateField('startDate', value)} onStartTimeChange={(value) => updateField('startTime', value)} onEndDateChange={(value) => updateField('endDate', value)} onEndTimeChange={(value) => updateField('endTime', value)} onLocationChange={(value) => updateField('location', value)} onContactNameChange={(value) => updateField('contactName', value)} onContactEmailChange={(value) => updateField('contactEmail', value)} onContactPhoneChange={(value) => updateField('contactPhone', value)} onFileAdd={handleFileAdd} onFileRemove={(id) => setFiles((current) => current.filter((file) => file.id !== id))} onDragStateChange={setIsDragging} onSubmit={handleSubmit} />}
      </div>
    </main>
  );
}
