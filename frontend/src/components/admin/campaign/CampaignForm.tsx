import { useState, useId, FormEvent } from 'react';
import type { CreateCampaignPayload } from '@/lib/api/campaigns';

interface CampaignFormProps {
  isLoading: boolean;
  onCancel: () => void;
  onSubmit: (payload: CreateCampaignPayload) => Promise<void>;
}

export default function CampaignForm({
  isLoading,
  onCancel,
  onSubmit,
}: CampaignFormProps) {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  const [seasonLabel, setSeasonLabel] = useState(
    `Campagne annuelle de réservation de salles ${nextYear}`
  );
  const [annee, setAnnee] = useState(String(nextYear));
  const [openingDate, setOpeningDate] = useState(`${nextYear}-06-01`);
  const [openingTime, setOpeningTime] = useState('00:00');
  const [closingDate, setClosingDate] = useState(`${nextYear}-09-30`);
  const [closingTime, setClosingTime] = useState('23:59');
  const [errorFeedback, setErrorFeedback] = useState<string | null>(null);

  const seasonLabelId = useId();
  const anneeId = useId();
  const openingDateId = useId();
  const openingTimeId = useId();
  const closingDateId = useId();
  const closingTimeId = useId();

  // Validation en direct de la cohérence chronologique (Scénario 4 du ticket)
  const dateError = (() => {
    if (!openingDate || !closingDate) return null;
    const start = new Date(`${openingDate}T${openingTime || '00:00'}:00`);
    const end = new Date(`${closingDate}T${closingTime || '23:59'}:00`);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 'Format de date ou heure invalide.';
    }

    if (end <= start) {
      return 'Incohérence temporelle : la date et l’heure de clôture doivent être strictement postérieures à l’ouverture.';
    }

    return null;
  })();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorFeedback(null);

    if (dateError) {
      setErrorFeedback(dateError);
      return;
    }

    if (!seasonLabel.trim()) {
      setErrorFeedback('Veuillez renseigner le libellé de la campagne.');
      return;
    }

    const openingAt = new Date(`${openingDate}T${openingTime}:00`).toISOString();
    const closingAt = new Date(`${closingDate}T${closingTime}:00`).toISOString();

    try {
      await onSubmit({
        seasonLabel: seasonLabel.trim(),
        openingAt,
        closingAt,
        resourceTypes: ['salle'],
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorFeedback(err.message);
      } else {
        setErrorFeedback('Une erreur est survenue lors de l’enregistrement de la campagne.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Bouton retour */}
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-hover cursor-pointer"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Gestion des campagnes</span>
      </button>

      {/* Titre & Statut (Figma Image 2) */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-ink sm:text-3xl">
            PRÉPARER LA CAMPAGNE ANNUELLE
          </h1>
          <p className="mt-1 text-sm text-muted">
            Configurez les demandes de salles et vérifiez les informations avant le lancement.
          </p>
        </div>
        <div>
          <span className="inline-flex items-center rounded-control bg-slate-100 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 ring-1 ring-slate-300">
            Non lancée
          </span>
        </div>
      </div>

      {/* Bannière explicative pastel (Figma Image 2) */}
      <div className="flex items-center gap-3 rounded-2xl border border-lime-300 bg-lime-100/70 p-4 text-lime-950">
        <svg className="h-5 w-5 shrink-0 text-lime-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs font-medium sm:text-sm">
          Une campagne par an, du 1er juin au 30 septembre. Chaque association choisit les salles et les créneaux souhaités pendant cette période.
        </p>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-8 rounded-2xl border border-border bg-white p-6 sm:p-8 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-ink">Informations de la campagne</h2>
        </div>

        {errorFeedback && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm font-semibold text-rose-800"
          >
            <svg className="h-5 w-5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{errorFeedback}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
          {/* Nom de la campagne */}
          <div className="sm:col-span-3">
            <label htmlFor={seasonLabelId} className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
              Nom de la campagne
            </label>
            <input
              id={seasonLabelId}
              type="text"
              required
              value={seasonLabel}
              onChange={(e) => setSeasonLabel(e.target.value)}
              placeholder="ex: Campagne annuelle de réservation de salles 2027"
              className="w-full rounded-control border border-border bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Année */}
          <div className="sm:col-span-1">
            <label htmlFor={anneeId} className="block text-xs font-bold uppercase tracking-wider text-ink mb-1.5">
              Année
            </label>
            <input
              id={anneeId}
              type="number"
              min={currentYear}
              max={currentYear + 5}
              value={annee}
              onChange={(e) => {
                const val = e.target.value;
                setAnnee(val);
                if (val && !isNaN(Number(val))) {
                  setOpeningDate(`${val}-06-01`);
                  setClosingDate(`${val}-09-30`);
                  setSeasonLabel(`Campagne annuelle de réservation de salles ${val}`);
                }
              }}
              className="w-full rounded-control border border-border bg-surface px-4 py-2.5 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Date & Time pickers d'ouverture et de clôture */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {/* Ouverture des demandes */}
          <div className="space-y-1.5">
            <label htmlFor={openingDateId} className="block text-xs font-bold uppercase tracking-wider text-ink">
              Ouverture des demandes
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex flex-1 items-center rounded-control border border-border bg-white px-3.5 py-2.5 shadow-2xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <svg className="h-5 w-5 shrink-0 text-muted mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input
                  id={openingDateId}
                  type="date"
                  required
                  value={openingDate}
                  onChange={(e) => setOpeningDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-ink outline-none cursor-pointer"
                />
              </div>

              {/* Sélecteur d'heure d'ouverture */}
              <div className="relative flex w-36 items-center rounded-control border border-border bg-white px-3 py-2.5 shadow-2xs focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <svg className="h-4 w-4 shrink-0 text-muted mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <input
                  id={openingTimeId}
                  type="time"
                  required
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  aria-label="Heure d'ouverture"
                  className="w-full bg-transparent text-sm font-semibold text-ink outline-none cursor-pointer"
                />
              </div>
            </div>
            <p className="text-xs text-muted">
              Ouverture planifiée à {openingTime.replace(':', ' h ')}
            </p>
          </div>

          {/* Clôture des demandes */}
          <div className="space-y-1.5">
            <label htmlFor={closingDateId} className="block text-xs font-bold uppercase tracking-wider text-ink">
              Clôture des demandes
            </label>
            <div className="flex items-center gap-2">
              <div
                className={`relative flex flex-1 items-center rounded-control border bg-white px-3.5 py-2.5 shadow-2xs focus-within:ring-2 ${
                  dateError
                    ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-200'
                    : 'border-border focus-within:border-primary focus-within:ring-primary/20'
                }`}
              >
                <svg className="h-5 w-5 shrink-0 text-muted mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <input
                  id={closingDateId}
                  type="date"
                  required
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-ink outline-none cursor-pointer"
                />
              </div>

              {/* Sélecteur d'heure de clôture */}
              <div
                className={`relative flex w-36 items-center rounded-control border bg-white px-3 py-2.5 shadow-2xs focus-within:ring-2 ${
                  dateError
                    ? 'border-rose-400 focus-within:border-rose-500 focus-within:ring-rose-200'
                    : 'border-border focus-within:border-primary focus-within:ring-primary/20'
                }`}
              >
                <svg className="h-4 w-4 shrink-0 text-muted mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 16 14" />
                </svg>
                <input
                  id={closingTimeId}
                  type="time"
                  required
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  aria-label="Heure de clôture"
                  className="w-full bg-transparent text-sm font-semibold text-ink outline-none cursor-pointer"
                />
              </div>
            </div>
            <p className="text-xs text-muted">
              Clôture ferme à {closingTime.replace(':', ' h ')} inclus
            </p>
          </div>
        </div>

        {/* Message d'erreur visuel sous les sélecteurs de date (Scénario 4) */}
        {dateError && (
          <p className="text-xs sm:text-sm font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
            {dateError}
          </p>
        )}

        {/* Footer avec boutons d'actions (Figma Image 2) */}
        <div className="border-t border-border pt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            La campagne n&apos;est pas encore lancée. Les associations seront informées après confirmation.
          </p>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={isLoading}
              onClick={onCancel}
              className="inline-flex justify-center rounded-control border border-border bg-white px-5 py-2.5 text-sm font-semibold text-ink shadow-xs hover:bg-surface disabled:opacity-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading || Boolean(dateError)}
              className="inline-flex items-center gap-2 rounded-control bg-primary px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-xs transition hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                  <span>CONFIRMER LE LANCEMENT</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
