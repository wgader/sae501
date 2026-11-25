import type { ModuleStep } from '@/components/ui/ModulePageHeader';

// Les étapes décrivent le parcours réel de chaque démarche (statuts et contrôles côté serveur).
export const EVENT_STEPS: readonly ModuleStep[] = [
  { title: 'Décrivez l’évènement', description: 'Nom, type, dates, lieu et la personne à contacter le jour J.' },
  { title: 'Joignez les documents', description: 'Autorisations, plans, affiches… en PDF ou image, 10 Mo maximum par fichier.' },
  { title: 'La mairie en prend connaissance', description: 'Vous suivez la déclaration dans l’Historique et recevez une notification.' },
];

export const GRANT_STEPS: readonly ModuleStep[] = [
  { title: 'Choisissez le type d’aide', description: 'Fonctionnement de l’association ou financement d’un projet précis.' },
  { title: 'Détaillez le budget', description: 'Dépenses, recettes et montant demandé. Le brouillon est enregistré à chaque étape.' },
  { title: 'Ajoutez RIB et pièces', description: 'Le RIB est vérifié avant l’envoi, puis les justificatifs demandés.' },
  { title: 'Transmettez le dossier', description: 'La mairie l’étudie, peut demander un complément, puis rend sa décision.' },
];

export const EQUIPMENT_STEPS: readonly ModuleStep[] = [
  { title: 'Choisissez le matériel', description: 'Filtrez le catalogue par catégorie et vérifiez le stock disponible.' },
  { title: 'Indiquez vos dates', description: 'Jour et heure de retrait, puis de restitution, aux horaires du service.' },
  { title: 'Attendez la validation', description: 'La mairie confirme la demande. Vous êtes notifié à chaque changement.' },
  { title: 'Retirez puis rendez', description: 'Présentez-vous aux horaires prévus et rendez le matériel complet.' },
];

export const CAMPAIGN_STEPS: readonly ModuleStep[] = [
  { title: 'Saisissez vos vœux', description: 'Salle, jour, horaires, fréquence, activité, public et effectif attendu.' },
  { title: 'Vérifiez le récapitulatif', description: 'Corrigez si besoin, puis transmettez : un e-mail confirme l’envoi.' },
  { title: 'La mairie arbitre', description: 'Après la clôture, chaque vœu est attribué ou refusé avec un motif.' },
];

export const ROOM_BOOKING_STEPS: readonly ModuleStep[] = [
  { title: 'Cherchez un créneau', description: 'Dates, horaires et nombre de personnes : seules les salles libres s’affichent.' },
  { title: 'Réservez la salle', description: 'Le créneau est bloqué pour votre association dès votre demande.' },
  { title: 'La mairie confirme', description: 'Vous recevez la réponse par notification et la retrouvez dans l’Historique.' },
];
