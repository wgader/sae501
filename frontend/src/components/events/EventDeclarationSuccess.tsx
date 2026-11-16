import Link from 'next/link';
import type { ExternalEvent } from '@/lib/api';

interface EventDeclarationSuccessProps {
  event: ExternalEvent;
  onReset: () => void;
}

export default function EventDeclarationSuccess({ event, onReset }: EventDeclarationSuccessProps) {
  return (
    <section aria-labelledby="confirmation-heading" className="mt-6 rounded-card border border-emerald-200 bg-white p-6 shadow-xs sm:p-10">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</div>
        <h2 id="confirmation-heading" className="mt-4 text-2xl font-black text-ink">Déclaration transmise avec succès !</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-muted">Votre déclaration d’événement extérieur a bien été enregistrée sous le dossier <strong className="text-ink">#EVT-{event.id}</strong> et transmise aux services de la mairie de Feytiat.</p>
      </div>
      <dl className="mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-line bg-paper p-6 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-muted">Nom de l’événement</dt><dd className="font-bold text-ink">{event.title}</dd></div>
        <div><dt className="text-xs text-muted">Type</dt><dd className="font-semibold text-ink">{event.event_type}</dd></div>
        <div><dt className="text-xs text-muted">Lieu</dt><dd className="font-semibold text-ink">{event.location}</dd></div>
        <div><dt className="text-xs text-muted">Statut</dt><dd className="font-semibold text-amber-800">En attente d’instruction</dd></div>
        <div><dt className="text-xs text-muted">Date & horaires</dt><dd className="font-medium text-ink">Du {new Date(event.start_date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}<br />au {new Date(event.end_time).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</dd></div>
        <div><dt className="text-xs text-muted">Pièces jointes</dt><dd className="font-semibold text-ink">{event.files?.length ? `${event.files.length} document(s) téléversé(s)` : 'Aucun document téléversé'}</dd></div>
      </dl>
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
        <button type="button" onClick={onReset} className="w-full rounded-control border border-line bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-ink hover:bg-paper sm:w-auto">Déclarer un autre événement</button>
        <Link href="/historique" className="inline-flex w-full items-center justify-center rounded-control bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 sm:w-auto">Suivre mes démarches</Link>
      </div>
    </section>
  );
}
