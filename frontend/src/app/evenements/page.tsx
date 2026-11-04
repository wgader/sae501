'use client';

import { useState, type FormEvent, type ChangeEvent, type DragEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createExternalEvent, uploadExternalEventFile, type ExternalEvent } from '@/lib/api';

const EVENT_TYPES = [
  'Fête de quartier / village',
  'Manifestation sportive / Tournoi',
  'Concert / Spectacle musical',
  'Brocante / Vide-grenier',
  'Course / Randonnée pédestre ou cycliste',
  'Rassemblement sur la voie publique',
  'Autre manifestation extérieure',
];

interface FormFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

export default function EvenementsPage() {
  const router = useRouter();

  // Form fields
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // Uploaded files
  const [files, setFiles] = useState<FormFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successEvent, setSuccessEvent] = useState<ExternalEvent | null>(null);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  function handleFileAdd(selectedFiles: FileList | File[]) {
    setError(null);
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10 Mo
    const newFiles: FormFile[] = [];

    Array.from(selectedFiles).forEach((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      if (!validExtensions.includes(ext)) {
        setError(`Le fichier « ${file.name} » n'est pas autorisé. Formats acceptés : PDF, PNG, JPG, JPEG.`);
        return;
      }
      if (file.size > maxSizeBytes) {
        setError(`Le fichier « ${file.name} » dépasse la taille maximale de 10 Mo.`);
        return;
      }
      newFiles.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
      });
    });

    setFiles((prev) => [...prev, ...newFiles]);
  }

  function handleFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFileAdd(e.target.files);
    }
  }

  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileAdd(e.dataTransfer.files);
    }
  }

  function handleRemoveFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError('Veuillez renseigner le nom de l’événement.');
      return;
    }
    if (!eventType) {
      setError('Veuillez sélectionner un type d’événement.');
      return;
    }
    if (!startDate || !startTime) {
      setError('Veuillez renseigner la date et l’heure de début.');
      return;
    }
    if (!endDate || !endTime) {
      setError('Veuillez renseigner la date et l’heure de fin.');
      return;
    }
    if (!location.trim()) {
      setError('Veuillez renseigner le lieu de l’événement.');
      return;
    }
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setError('Veuillez renseigner l’ensemble des informations du contact référent.');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startTime}:00`);
    const endDateTime = new Date(`${endDate}T${endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setError('Les dates et horaires saisis sont invalides.');
      return;
    }

    if (endDateTime <= startDateTime) {
      setError('La date et l’heure de fin doivent être postérieures à la date et l’heure de début.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create the external event via API
      const createdEvent = await createExternalEvent({
        title: title.trim(),
        location: location.trim(),
        event_type: eventType,
        start_date: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });

      // 2. Upload each attached file
      const uploadedFileResults = [];
      for (const formFile of files) {
        try {
          const res = await uploadExternalEventFile(createdEvent.id, formFile.file);
          uploadedFileResults.push(res);
        } catch (uploadErr) {
          console.error(`Erreur upload ${formFile.name}:`, uploadErr);
        }
      }

      const completeEvent: ExternalEvent = {
        ...createdEvent,
        description: description.trim() || undefined,
        contact_nom: contactName.trim(),
        contact_email: contactEmail.trim(),
        contact_telephone: contactPhone.trim(),
        files: uploadedFileResults.map((res) => ({
          id: res.id,
          original_name: res.original_name,
          file_type: res.file_type,
          mime_type: res.mime_type,
          file_size: res.file_size,
        })),
      };

      // 3. Persist to démarches history in localStorage
      try {
        const storedDemarches = JSON.parse(localStorage.getItem('feytiat_demarches_events') || '[]');
        storedDemarches.unshift(completeEvent);
        localStorage.setItem('feytiat_demarches_events', JSON.stringify(storedDemarches));
      } catch {
        // Ignorer si localStorage non disponible
      }

      setSuccessEvent(completeEvent);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur inattendue est survenue lors de l’enregistrement de votre déclaration.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setTitle('');
    setEventType('');
    setDescription('');
    setStartDate('');
    setStartTime('');
    setEndDate('');
    setEndTime('');
    setLocation('');
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setFiles([]);
    setError(null);
    setSuccessEvent(null);
  }

  return (
    <main className="min-h-screen bg-[var(--paper)] px-4 py-6 sm:px-8 lg:px-12 lg:py-8">
      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="mb-4">
          <ol className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
            <li>
              <Link href="/" className="inline-flex items-center gap-1 hover:text-[var(--Mosaic-Tile)] transition-colors">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Accueil</span>
              </Link>
            </li>
            <li aria-hidden="true" className="text-[var(--line)]">|</li>
            <li className="text-[var(--ink)] font-bold" aria-current="page">Déclarer un évènement</li>
          </ol>
        </nav>

        {/* Header Banner */}
        <header className="rounded-[20px] bg-[var(--Mint-Cream)] px-6 py-6 sm:px-8 sm:py-7">
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.2em] text-[var(--ink)]/80 sm:text-[0.75rem]">
            ESPACE ASSOCIATIONS - ORGANISER
          </p>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[var(--ink)]">
            Déclarer un évènement
          </h1>
          <p className="mt-1 text-sm text-[var(--ink)]/80">
            Informez la mairie de votre évènement et transmettez les documents utiles.
          </p>
        </header>

        {/* Success Confirmation View (Scenario 1) */}
        {successEvent ? (
          <section
            aria-labelledby="confirmation-heading"
            className="mt-6 rounded-[24px] border border-emerald-200 bg-[var(--White)] p-6 sm:p-10 shadow-xs"
          >
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>

              <h2 id="confirmation-heading" className="mt-4 text-2xl font-black text-[var(--ink)]">
                Déclaration transmise avec succès !
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">
                Votre déclaration d’événement extérieur a bien été enregistrée sous le dossier{' '}
                <strong className="text-[var(--ink)]">#EVT-{successEvent.id}</strong> et transmise aux services de la mairie de Feytiat.
              </p>
            </div>

            {/* Synthetic recap of submitted dossier */}
            <div className="mt-8 rounded-[16px] border border-[var(--line)] bg-[var(--paper)] p-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">
                Récapitulatif de votre démarche
              </h3>

              <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
                <div>
                  <dt className="text-xs text-[var(--muted)]">Nom de l’événement</dt>
                  <dd className="font-bold text-[var(--ink)]">{successEvent.title}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Type</dt>
                  <dd className="font-semibold text-[var(--ink)]">{successEvent.event_type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Lieu</dt>
                  <dd className="font-semibold text-[var(--ink)]">{successEvent.location}</dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Statut de la démarche</dt>
                  <dd className="inline-flex items-center gap-1.5 mt-0.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      En attente d’instruction
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Date & horaires</dt>
                  <dd className="font-medium text-[var(--ink)]">
                    Du {new Date(successEvent.start_date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}<br />
                    au {new Date(successEvent.end_time).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-[var(--muted)]">Pièces justificatives jointes</dt>
                  <dd className="font-semibold text-[var(--ink)]">
                    {successEvent.files && successEvent.files.length > 0
                      ? `${successEvent.files.length} document(s) téléversé(s)`
                      : 'Aucun document téléversé'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
              <button
                type="button"
                onClick={handleReset}
                className="w-full sm:w-auto rounded-[10px] border border-[var(--line)] bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink)] hover:bg-[var(--paper)] transition"
              >
                Déclarer un autre événement
              </button>

              <Link
                href="/historique"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] hover:opacity-90 transition shadow-sm"
              >
                Suivre mes démarches
              </Link>
            </div>
          </section>
        ) : (
          /* Event Declaration Form Card */
          <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-[var(--White)] p-6 sm:p-10 shadow-xs">
            <header className="border-b border-[var(--line)] pb-5">
              <h2 className="text-2xl font-black tracking-tight text-[var(--ink)]">
                Votre évènement
              </h2>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Les champs marqués d&apos;un * sont obligatoires.
              </p>
            </header>

            {error && (
              <div
                role="alert"
                className="mt-6 flex items-start gap-3 rounded-[12px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-4 text-xs font-semibold leading-5 text-[var(--Flush-Mahogany)]"
              >
                <svg className="h-5 w-5 shrink-0 text-[var(--Flush-Mahogany)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-8">
              {/* 1. Informations générales */}
              <fieldset className="space-y-4">
                <legend className="text-sm font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">
                  Informations générales
                </legend>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="title" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                      Nom de l&apos;évènement *
                    </label>
                    <input
                      id="title"
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex. Fête de l'association"
                      className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="eventType" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                      Type d&apos;événement *
                    </label>
                    <div className="relative">
                      <select
                        id="eventType"
                        required
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value)}
                        className="w-full appearance-none rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 pr-10 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                      >
                        <option value="">Sélectionner</option>
                        {EVENT_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="description" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Présentez l'événement, son programme et le public concerné..."
                    className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                  />
                </div>
              </fieldset>

              {/* 2. Dates et horaires */}
              <fieldset className="space-y-4 pt-2">
                <legend className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>Dates et horaires</span>
                </legend>

                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div>
                    <label htmlFor="startDate" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                      Date de début *
                    </label>
                    <input
                      id="startDate"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="startTime" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                      Heure de début *
                    </label>
                    <input
                      id="startTime"
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                      Date de fin *
                    </label>
                    <input
                      id="endDate"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="endTime" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                      Heure de fin *
                    </label>
                    <input
                      id="endTime"
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-3 py-3 text-sm text-[var(--ink)] focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="location" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                    Lieu de l&apos;événement *
                  </label>
                  <input
                    id="location"
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Nom du lieu et adresse à Feytiat"
                    className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                  />
                </div>
              </fieldset>

              {/* 3. Contact référent */}
              <fieldset className="space-y-4 pt-2">
                <legend className="text-sm font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">
                  Contact référent
                </legend>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label htmlFor="contactName" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                      Nom et prénom *
                    </label>
                    <input
                      id="contactName"
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ex. Marie Dupont"
                      className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="contactEmail" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                      Adresse e-mail *
                    </label>
                    <input
                      id="contactEmail"
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="contact@association.fr"
                      className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="contactPhone" className="block text-xs font-bold text-[var(--ink)] mb-1.5">
                      Téléphone *
                    </label>
                    <input
                      id="contactPhone"
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="06 12 34 56 78"
                      className="w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition"
                    />
                  </div>
                </div>
              </fieldset>

              {/* 4. Documents utiles (Arrêté, affiches, plans...) */}
              <fieldset className="space-y-4 pt-2">
                <legend className="text-sm font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">
                  Documents utiles
                </legend>
                <p className="text-xs text-[var(--muted)]">
                  Ajoutez les autorisations, plans, demandes d&apos;arrêté, affiches ou autres documents utiles. PDF, PNG, JPG ou JPEG (max. 10 Mo par fichier).
                </p>

                {/* Dropzone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-[16px] border-2 border-dashed p-8 text-center transition cursor-pointer ${
                    isDragging
                      ? 'border-[var(--Mosaic-Tile)] bg-[var(--Mint-Cream)]/40'
                      : 'border-[#B6D9D2] bg-[#F4FAF8] hover:bg-[#EDF7F4]'
                  }`}
                  onClick={() => document.getElementById('event-file-upload')?.click()}
                >
                  <input
                    id="event-file-upload"
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="sr-only"
                    onChange={handleFileInputChange}
                  />

                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--Mint-Cream)] text-[var(--Mosaic-Tile)]">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>

                  <p className="mt-3 text-sm font-bold text-[var(--Mosaic-Tile)]">
                    Déposez vos fichiers ici
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    ou cliquez pour les sélectionner
                  </p>
                </div>

                {/* List of files ready to upload */}
                {files.length > 0 && (
                  <ul className="space-y-2 pt-2 list-none p-0">
                    {files.map((fileItem) => (
                      <li
                        key={fileItem.id}
                        className="flex items-center justify-between rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <svg className="h-4 w-4 shrink-0 text-[var(--Mosaic-Tile)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                          </svg>
                          <span className="font-semibold text-[var(--ink)] truncate">{fileItem.name}</span>
                          <span className="text-[var(--muted)] shrink-0">({formatFileSize(fileItem.size)})</span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(fileItem.id);
                          }}
                          className="ml-3 rounded-md p-1 text-[var(--muted)] hover:bg-rose-50 hover:text-[var(--Flush-Mahogany)] transition"
                          aria-label={`Supprimer ${fileItem.name}`}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </fieldset>

              {/* Form Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-[10px] border border-[var(--Mosaic-Tile)] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--Mosaic-Tile)] hover:bg-[var(--paper)] transition"
                >
                  Retour à l&apos;accueil
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-8 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] hover:opacity-90 transition shadow-sm disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Transmission en cours...</span>
                    </>
                  ) : (
                    <span>Transmettre la déclaration</span>
                  )}
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
