import type { AssociationStatus, GrantBudgetLine, GrantDraft, GrantDraftInput, GrantStatus } from '@/lib/api';

export type GrantFormState = {
  typeSubvention: 'Fonctionnement' | 'Projet';
  intituleProjet: string;
  description: string;
  publicCible: string;
  dateDebutProjet: string;
  dateFinProjet: string;
  montantDemande: string;
  bic: string;
  iban: string;
  lignesBudget: GrantBudgetLine[];
};

export type GrantFormErrors = Partial<Record<keyof GrantFormState, string>>;

const MAX_REQUESTED_CENTS = 100_000_000;

const municipalGrantLine: GrantBudgetLine = {
  type: 'recette',
  categorie: 'subvention_mairie',
  intitule: 'Subvention demandée à la mairie',
  montant: '0.00',
};

export function createEmptyGrantForm(): GrantFormState {
  return {
    typeSubvention: 'Projet',
    intituleProjet: 'Demande de subvention',
    description: '',
    publicCible: '',
    dateDebutProjet: '',
    dateFinProjet: '',
    montantDemande: '',
    bic: '',
    iban: '',
    lignesBudget: [municipalGrantLine],
  };
}

export function grantFormFromDraft(draft: GrantDraft): GrantFormState {
  // Un brouillon neuf vaut 0,00 € côté API : le champ reste vide pour l'association.
  const requestedAmount = draft.montantDemande === '0.00' ? '' : draft.montantDemande;

  return {
    typeSubvention: draft.typeSubvention,
    intituleProjet: draft.intituleProjet,
    description: draft.description ?? '',
    publicCible: draft.publicCible ?? '',
    dateDebutProjet: draft.dateDebutProjet ?? '',
    dateFinProjet: draft.dateFinProjet ?? '',
    montantDemande: requestedAmount,
    bic: draft.bic ?? '',
    iban: draft.iban ?? '',
    lignesBudget: [
      ...(Array.isArray(draft.lignesBudget)
        ? draft.lignesBudget.filter((line) => line.categorie !== 'subvention_mairie')
        : []),
      { ...municipalGrantLine, montant: draft.montantDemande },
    ],
  };
}

export function grantPayloadFromForm(form: GrantFormState): GrantDraftInput {
  return {
    ...form,
    lignesBudget: form.lignesBudget.map((line) =>
      line.categorie === 'subvention_mairie'
        ? { ...municipalGrantLine, montant: form.montantDemande || '0.00' }
        : line,
    ),
  };
}

export function amountToCents(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (normalized === '') return 0;
  if (!/^\d+(?:\.\d{0,2})?$/.test(normalized)) return null;

  const [whole, fraction = ''] = normalized.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function normalizeBankingCode(value: string): string {
  return value.replace(/\s/g, '').toUpperCase();
}

function isValidBic(value: string): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}(?:[A-Z0-9]{3})?$/.test(normalizeBankingCode(value));
}

function isValidIban(value: string): boolean {
  const iban = normalizeBankingCode(value);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return false;

  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  const numeric = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));
  let remainder = 0;
  for (const digit of numeric) remainder = (remainder * 10 + Number(digit)) % 97;
  return remainder === 1;
}

/** Contrôles requis pour passer aux pièces justificatives ; un brouillon peut rester incomplet. */
export function validateGrantForm(form: GrantFormState): GrantFormErrors {
  const errors: GrantFormErrors = {};
  const requestedCents = amountToCents(form.montantDemande);

  if (!form.intituleProjet.trim()) errors.intituleProjet = 'Le nom de la demande est obligatoire.';
  if (requestedCents === null || requestedCents <= 0) {
    errors.montantDemande = 'Le montant demandé doit être un montant positif.';
  } else if (requestedCents > MAX_REQUESTED_CENTS) {
    errors.montantDemande = 'Le montant demandé dépasse la limite autorisée de 1 000 000 €.';
  }
  if (!form.bic.trim()) errors.bic = 'Le BIC est obligatoire.';
  else if (!isValidBic(form.bic)) errors.bic = 'Le BIC doit contenir 8 ou 11 caractères au format bancaire.';
  if (!form.iban.trim()) errors.iban = 'L’IBAN est obligatoire.';
  else if (!isValidIban(form.iban)) errors.iban = 'L’IBAN est incomplet ou invalide.';

  return errors;
}

export function formatGrantAmount(value: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((amountToCents(value) ?? 0) / 100);
}

/** Pastille de statut d'un dossier transmis, sur les couleurs déjà utilisées pour les autres demandes. */
export function grantStatusBadge(status: GrantStatus): { code: AssociationStatus; label: string } {
  switch (status) {
    case 'Validée':
      return { code: 'VALIDATED', label: 'Validée' };
    case 'Refusée':
      return { code: 'REFUSED', label: 'Refusée' };
    case 'Complément requis':
    case 'Clôturée':
      return { code: 'SUSPENDED', label: status };
    default:
      return { code: 'PENDING_VALIDATION', label: 'En attente' };
  }
}

export function formatGrantDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}
