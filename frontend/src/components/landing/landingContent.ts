import type { ComponentType } from 'react';
import { IconEvenement, IconMateriel, IconSalle, IconSubvention, type IconProps } from '@/components/ui/icons';

/** Site de la ville, pour les démarches qui ne concernent pas les associations. */
export const CITY_WEBSITE_URL = 'https://www.ville-feytiat.fr';

export const LANDING_SECTIONS = {
  services: 'demarches',
  process: 'fonctionnement',
  audience: 'pour-qui',
  faq: 'questions',
} as const;

export const LANDING_NAV_LINKS: ReadonlyArray<{ href: string; label: string }> = [
  { href: `#${LANDING_SECTIONS.services}`, label: 'Les démarches' },
  { href: `#${LANDING_SECTIONS.process}`, label: 'Fonctionnement' },
  { href: `#${LANDING_SECTIONS.audience}`, label: 'Pour qui ?' },
  { href: `#${LANDING_SECTIONS.faq}`, label: 'Questions' },
];

export type ServiceTone = 'grants' | 'rooms' | 'equipment' | 'events';

export interface LandingService {
  tone: ServiceTone;
  kicker: string;
  title: string;
  description: string;
  features: string[];
  icon: ComponentType<IconProps>;
}

export const LANDING_SERVICES: ReadonlyArray<LandingService> = [
  {
    tone: 'grants',
    kicker: 'Subventions',
    title: 'Financer votre fonctionnement ou un projet',
    description: 'Préparez votre dossier à votre rythme, puis transmettez-le à la mairie quand il est complet.',
    features: ['Aide au fonctionnement ou au projet', 'Formulaire Cerfa et pièces en ligne', 'Décision et montant accordé par e-mail'],
    icon: IconSubvention,
  },
  {
    tone: 'rooms',
    kicker: 'Salles',
    title: 'Réserver une salle municipale',
    description: 'Consultez les disponibilités et réservez l’espace adapté à vos activités et manifestations.',
    features: ['Disponibilités en temps réel', 'Réservations ponctuelles', 'Campagne annuelle pour les créneaux réguliers'],
    icon: IconSalle,
  },
  {
    tone: 'equipment',
    kicker: 'Matériel',
    title: 'Emprunter le matériel communal',
    description: 'Tables, barnums, sonorisation : choisissez ce dont vous avez besoin et vos dates de retrait.',
    features: ['Catalogue du matériel disponible', 'Dates de retrait et de retour', 'Validation suivie en ligne'],
    icon: IconMateriel,
  },
  {
    tone: 'events',
    kicker: 'Événements',
    title: 'Déclarer vos manifestations',
    description: 'Informez la mairie de vos événements et transmettez les pièces utiles à leur bon déroulement.',
    features: ['Déclaration en quelques étapes', 'Pièces complémentaires à la demande', 'Historique des échanges'],
    icon: IconEvenement,
  },
];

export const LANDING_STEPS: ReadonlyArray<{ title: string; description: string }> = [
  {
    title: 'Inscrivez votre association',
    description: 'Renseignez son nom, son président et un contact. Aucun document n’est demandé à cette étape.',
  },
  {
    title: 'La mairie valide le compte',
    description: 'Après vérification, vous recevez un e-mail pour choisir votre mot de passe et activer l’espace.',
  },
  {
    title: 'Faites vos démarches',
    description: 'Déposez vos demandes, suivez leur état et recevez un e-mail à chaque décision de la mairie.',
  },
];

export const LANDING_AUDIENCE = {
  forWhom: [
    'Les associations dont le siège ou l’activité se trouve à Feytiat',
    'Leur président ou un membre du bureau qui gère les démarches',
    'Les clubs, comités et collectifs qui organisent la vie locale',
  ],
  notForWhom: [
    'Les démarches personnelles des habitants (état civil, urbanisme…)',
    'Les entreprises, commerces et organisateurs privés',
  ],
};

export const LANDING_FAQ: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: 'Qui peut créer un compte ?',
    answer: 'Une association de Feytiat, représentée par son président ou un membre du bureau. Les particuliers et les entreprises ne peuvent pas s’inscrire : leurs démarches se font sur le site de la ville.',
  },
  {
    question: 'Combien de temps faut-il pour que le compte soit actif ?',
    answer: 'La mairie vérifie chaque inscription avant de l’activer. Vous recevez un e-mail dès que c’est fait, avec un lien pour choisir votre mot de passe.',
  },
  {
    question: 'Puis-je préparer une demande et la terminer plus tard ?',
    answer: 'Oui. Une demande de subvention reste en brouillon tant que vous ne l’avez pas transmise. Vous pouvez la reprendre et ajouter vos pièces quand vous le souhaitez.',
  },
  {
    question: 'Comment savoir où en est ma demande ?',
    answer: 'Chaque démarche apparaît dans votre espace avec son statut : en attente, acceptée ou refusée. Un e-mail vous prévient à chaque décision de la mairie.',
  },
  {
    question: 'Cet espace remplace-t-il le contact avec la mairie ?',
    answer: 'Non. Il simplifie les démarches courantes, mais les services municipaux restent disponibles pour vous accompagner, notamment via la page Contact.',
  },
];
