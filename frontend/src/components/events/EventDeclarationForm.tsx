'use client';

import { type ChangeEvent, type DragEvent, type FormEvent } from 'react';

export interface EventFormFile {
  id: string;
  file: File;
  name: string;
  size: number;
}

interface EventDeclarationFormProps {
  title: string;
  eventType: string;
  description: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  files: EventFormFile[];
  isDragging: boolean;
  isSubmitting: boolean;
  error: string | null;
  onTitleChange: (value: string) => void;
  onEventTypeChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onStartTimeChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onContactNameChange: (value: string) => void;
  onContactEmailChange: (value: string) => void;
  onContactPhoneChange: (value: string) => void;
  onFileAdd: (files: FileList | File[]) => void;
  onFileRemove: (id: string) => void;
  onDragStateChange: (isDragging: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const EVENT_TYPES = [
  'Fête de quartier / village',
  'Manifestation sportive / Tournoi',
  'Concert / Spectacle musical',
  'Brocante / Vide-grenier',
  'Course / Randonnée pédestre ou cycliste',
  'Rassemblement sur la voie publique',
  'Autre manifestation extérieure',
];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

const inputClass = 'w-full rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-3 text-sm text-[var(--ink)] placeholder:text-[var(--muted)]/60 focus:border-[var(--Mosaic-Tile)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--Mosaic-Tile)]/20 transition';

export default function EventDeclarationForm({
  title, eventType, description, startDate, startTime, endDate, endTime, location,
  contactName, contactEmail, contactPhone, files, isDragging, isSubmitting, error,
  onTitleChange, onEventTypeChange, onDescriptionChange, onStartDateChange,
  onStartTimeChange, onEndDateChange, onEndTimeChange, onLocationChange,
  onContactNameChange, onContactEmailChange, onContactPhoneChange, onFileAdd,
  onFileRemove, onDragStateChange, onSubmit,
}: EventDeclarationFormProps) {
  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files?.length) onFileAdd(event.target.files);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    onDragStateChange(false);
    if (event.dataTransfer.files.length) onFileAdd(event.dataTransfer.files);
  }

  return (
    <section className="mt-6 rounded-[24px] border border-[var(--line)] bg-[var(--White)] p-6 shadow-xs sm:p-10">
      <header className="border-b border-[var(--line)] pb-5">
        <h2 className="text-2xl font-black tracking-tight text-[var(--ink)]">Votre évènement</h2>
        <p className="mt-1 text-xs text-[var(--muted)]">Les champs marqués d&apos;un * sont obligatoires.</p>
      </header>
      {error && <p role="alert" className="mt-6 rounded-[12px] border-l-4 border-[var(--Flush-Mahogany)] bg-rose-50/70 p-4 text-xs font-semibold text-[var(--Flush-Mahogany)]">{error}</p>}
      <form className="mt-8 space-y-8" onSubmit={onSubmit}>
        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">Informations générales</legend>
          <div>
            <label htmlFor="event-title" className="mb-1.5 block text-xs font-bold text-[var(--ink)]">Nom de l&apos;événement *</label>
            <input id="event-title" required value={title} onChange={(e) => onTitleChange(e.target.value)} className={inputClass} placeholder="Ex. Fête de quartier" />
          </div>
          <div>
            <label htmlFor="event-type" className="mb-1.5 block text-xs font-bold text-[var(--ink)]">Type d&apos;événement *</label>
            <select id="event-type" required value={eventType} onChange={(e) => onEventTypeChange(e.target.value)} className={inputClass}>
              <option value="">Sélectionnez un type</option>
              {EVENT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="event-description" className="mb-1.5 block text-xs font-bold text-[var(--ink)]">Description</label>
            <textarea id="event-description" rows={3} value={description} onChange={(e) => onDescriptionChange(e.target.value)} className={inputClass} placeholder="Présentez l'événement, son programme et le public concerné..." />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">Dates et horaires</legend>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <label className="text-xs font-bold text-[var(--ink)]">Date de début *<input type="date" required value={startDate} onChange={(e) => onStartDateChange(e.target.value)} className={`${inputClass} mt-1.5 px-3`} /></label>
            <label className="text-xs font-bold text-[var(--ink)]">Heure de début *<input type="time" required value={startTime} onChange={(e) => onStartTimeChange(e.target.value)} className={`${inputClass} mt-1.5 px-3`} /></label>
            <label className="text-xs font-bold text-[var(--ink)]">Date de fin *<input type="date" required value={endDate} onChange={(e) => onEndDateChange(e.target.value)} className={`${inputClass} mt-1.5 px-3`} /></label>
            <label className="text-xs font-bold text-[var(--ink)]">Heure de fin *<input type="time" required value={endTime} onChange={(e) => onEndTimeChange(e.target.value)} className={`${inputClass} mt-1.5 px-3`} /></label>
          </div>
          <label htmlFor="event-location" className="block text-xs font-bold text-[var(--ink)]">Lieu de l&apos;événement *
            <input id="event-location" required value={location} onChange={(e) => onLocationChange(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Nom du lieu et adresse à Feytiat" />
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">Contact référent</legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="text-xs font-bold text-[var(--ink)]">Nom et prénom *<input required value={contactName} onChange={(e) => onContactNameChange(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="Ex. Marie Dupont" /></label>
            <label className="text-xs font-bold text-[var(--ink)]">Adresse e-mail *<input type="email" required value={contactEmail} onChange={(e) => onContactEmailChange(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="contact@association.fr" /></label>
            <label className="text-xs font-bold text-[var(--ink)]">Téléphone *<input type="tel" required value={contactPhone} onChange={(e) => onContactPhoneChange(e.target.value)} className={`${inputClass} mt-1.5`} placeholder="06 12 34 56 78" /></label>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-bold uppercase tracking-wider text-[var(--Mosaic-Tile)]">Documents utiles</legend>
          <p className="text-xs text-[var(--muted)]">Ajoutez les autorisations, plans, affiches ou autres documents utiles. PDF, PNG, JPG ou JPEG (max. 10 Mo par fichier).</p>
          <div
            onDragOver={(event) => { event.preventDefault(); onDragStateChange(true); }}
            onDragLeave={() => onDragStateChange(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('event-file-upload')?.click()}
            className={`cursor-pointer rounded-[16px] border-2 border-dashed p-8 text-center transition ${isDragging ? 'border-[var(--Mosaic-Tile)] bg-[var(--Mint-Cream)]/40' : 'border-[#B6D9D2] bg-[#F4FAF8] hover:bg-[#EDF7F4]'}`}
          >
            <input id="event-file-upload" type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="sr-only" onChange={handleInputChange} />
            <p className="text-sm font-bold text-[var(--Mosaic-Tile)]">Déposez vos fichiers ici</p>
            <p className="mt-0.5 text-xs text-[var(--muted)]">ou cliquez pour les sélectionner</p>
          </div>
          {files.length > 0 && <ul className="space-y-2">{files.map((file) => <li key={file.id} className="flex items-center justify-between rounded-[10px] border border-[var(--line)] bg-[var(--paper)] px-4 py-2.5 text-xs"><span className="truncate">{file.name} <span className="text-[var(--muted)]">({formatFileSize(file.size)})</span></span><button type="button" onClick={() => onFileRemove(file.id)} className="ml-3 font-bold text-danger">Retirer</button></li>)}</ul>}
        </fieldset>

        <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {isSubmitting ? 'Transmission en cours...' : 'Transmettre ma déclaration'}
        </button>
      </form>
    </section>
  );
}
