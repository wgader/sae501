import { Fraunces } from 'next/font/google';

/** Police des titres de la page d'accueil, exposée via le token `font-display`. */
export const displayFont = Fraunces({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
});
