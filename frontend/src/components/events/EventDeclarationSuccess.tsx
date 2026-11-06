import Link from 'next/link';
import type { ExternalEvent } from '@/lib/api';

interface EventDeclarationSuccessProps {
  event: ExternalEvent;
  onReset: () => void;
}

export default function EventDeclarationSuccess({ event, onReset }: EventDeclarationSuccessProps) {
  return (
    <section aria-labelledby="confirmation-heading" className="mt-6 rounded-[24px] border border-emerald-200 bg-[var(--White)] p-6 shadow-xs sm:p-10">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</div>
        <h2 id="confirmation-heading" className="mt-4 text-2xl font-black text-[var(--ink)]">Déclaration transmise avec succès !</h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-[var(--muted)]">Votre déclaration d’événement extérieur a bien été enregistrée sous le dossier <strong className="text-[var(--ink)]">#EVT-{event.id}</strong> et transmise aux services de la mairie de Feytiat.</p>
      </div>
      <dl className="mt-8 grid grid-cols-1 gap-4 rounded-[16px] border border-[var(--line)] bg-[var(--paper)] p-6 text-sm sm:grid-cols-2">
        <div><dt className="text-xs text-[var(--muted)]">Nom de l’événement</dt><dd className="font-bold text-[var(--ink)]">{event.title}</dd></div>
        <div><dt className="text-xs text-[var(--muted)]">Type</dt><dd className="font-semibold text-[var(--ink)]">{event.event_type}</dd></div>
        <div><dt className="text-xs text-[var(--muted)]">Lieu</dt><dd className="font-semibold text-[var(--ink)]">{event.location}</dd></div>
        <div><dt className="text-xs text-[var(--muted)]">Statut</dt><dd className="font-semibold text-amber-800">En attente d’instruction</dd></div>
        <div><dt className="text-xs text-[var(--muted)]">Date & horaires</dt><dd className="font-medium text-[var(--ink)]">Du {new Date(event.start_date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}<br />au {new Date(event.end_time).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</dd></div>
        <div><dt className="text-xs text-[var(--muted)]">Pièces jointes</dt><dd className="font-semibold text-[var(--ink)]">{event.files?.length ? `${event.files.length} document(s) téléversé(s)` : 'Aucun document téléversé'}</dd></div>
      </dl>
      <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--line)] pt-6 sm:flex-row">
        <button type="button" onClick={onReset} className="w-full rounded-[10px] border border-[var(--line)] bg-white px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink)] hover:bg-[var(--paper)] sm:w-auto">Déclarer un autre événement</button>
        <Link href="/historique" className="inline-flex w-full items-center justify-center rounded-[10px] bg-[var(--Mosaic-Tile)] px-6 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[var(--White)] hover:opacity-90 sm:w-auto">Suivre mes démarches</Link>
      </div>
    </section>
  );
}
