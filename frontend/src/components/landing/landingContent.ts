import type { ComponentType } from 'react';
import { IconEvenement, IconMateriel, IconSalle, IconSubvention, type IconProps } from '@/components/ui/icons';

export const CITY_WEBSITE_URL = 'https://www.ville-feytiat.fr';

export const LANDING_ANCHORS = {
  modules: 'modules',
  steps: 'etapes',
  faq: 'questions',
} as const;

export const LANDING_FAQ_LIMIT = 6;

export const LANDING_NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: `#${LANDING_ANCHORS.modules}`, label: 'Modules' },
  { href: `#${LANDING_ANCHORS.steps}`, label: 'Fonctionnement' },
  { href: `#${LANDING_ANCHORS.faq}`, label: 'Questions' },
];

export type ModuleId = 'grants' | 'rooms' | 'equipment' | 'events';

export interface LandingModule {
  id: ModuleId;
  name: string;
  title: string;
  text: string;
  points: [string, string, string];
  icon: ComponentType<IconProps>;
}

export const LANDING_MODULES: ReadonlyArray<LandingModule> = [
  {
    id: 'grants',
    name: 'Subventions',
    title: 'Financez vos projets',
    text: 'Montez votre dossier, joignez vos pièces, suivez la décision.',
    points: ['Fonctionnement ou projet', 'Cerfa en ligne', 'Réponse par e-mail'],
    icon: IconSubvention,
  },
  {
    id: 'rooms',
    name: 'Salles',
    title: 'Réservez une salle',
    text: 'Voyez les créneaux libres et réservez en quelques clics.',
    points: ['Planning en direct', 'Réservation ponctuelle', 'Campagne annuelle'],
    icon: IconSalle,
  },
  {
    id: 'equipment',
    name: 'Matériel',
    title: 'Empruntez du matériel',
    text: 'Tables, barnums, sono : choisissez ce qu’il vous faut et vos dates.',
    points: ['Catalogue communal', 'Retrait et retour', 'Suivi de la demande'],
    icon: IconMateriel,
  },
  {
    id: 'events',
    name: 'Événements',
    title: 'Déclarez vos événements',
    text: 'Prévenez la mairie et transmettez les pièces demandées.',
    points: ['Déclaration guidée', 'Pièces à la demande', 'Historique complet'],
    icon: IconEvenement,
  },
];

export const LANDING_STEPS: ReadonlyArray<{ title: string; text: string }> = [
  { title: 'Créez le compte', text: 'Le nom de l’asso, son président, un contact.' },
  { title: 'La mairie valide', text: 'Vous recevez un e-mail pour activer l’espace.' },
  { title: 'C’est parti', text: 'Déposez vos demandes et suivez chaque réponse.' },
];

export const LANDING_FAQ: ReadonlyArray<{ question: string; answer: string }> = [
  {
    question: 'Qui peut créer un compte ?',
    answer: 'Les associations de Feytiat, via leur président ou un membre du bureau. Les particuliers passent par le site de la ville.',
  },
  {
    question: 'Quand mon compte est-il actif ?',
    answer: 'Dès que la mairie a vérifié l’inscription. Un e-mail vous invite alors à choisir votre mot de passe.',
  },
  {
    question: 'Puis-je finir une demande plus tard ?',
    answer: 'Oui, elle reste en brouillon jusqu’à ce que vous la transmettiez.',
  },
  {
    question: 'Comment suivre mes demandes ?',
    answer: 'Chaque demande affiche son statut dans votre espace, et un e-mail vous prévient à chaque décision.',
  },
];
