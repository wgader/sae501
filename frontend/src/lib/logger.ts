/**
 * Journal du front, par niveau de gravité (du plus bavard au plus grave) :
 *   silly   détail très fin, rarement utile
 *   debug   mise au point (valeurs, temps d'exécution)
 *   verbose ce que fait le code, étape par étape
 *   info    événement normal (connexion, envoi d'un formulaire)
 *   warn    anomalie sans gravité, l'application continue
 *   error   erreur interceptée
 *
 * Seuls les messages au moins aussi graves que le niveau choisi sont écrits dans la console du
 * navigateur : tout à partir de debug en développement, à partir de warn en production
 * (NEXT_PUBLIC_LOG_LEVEL au build pour un autre seuil).
 */
const LEVELS = { silly: 0, debug: 1, verbose: 2, info: 3, warn: 4, error: 5 } as const;

export type LogLevel = keyof typeof LEVELS;

const isLogLevel = (value: string | undefined): value is LogLevel => value !== undefined && value in LEVELS;

const configuredLevel = process.env.NEXT_PUBLIC_LOG_LEVEL;
const threshold: LogLevel = isLogLevel(configuredLevel)
  ? configuredLevel
  : process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

/* eslint-disable no-console -- seul fichier autorisé à écrire dans la console */
const OUTPUT: Record<LogLevel, (...data: unknown[]) => void> = {
  silly: console.debug,
  debug: console.debug,
  verbose: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};
/* eslint-enable no-console */

function write(level: LogLevel, message: string, details: unknown[]): void {
  if (LEVELS[level] < LEVELS[threshold]) return;
  OUTPUT[level](`[${level}] ${message}`, ...details);
}

export const logger = {
  silly: (message: string, ...details: unknown[]) => write('silly', message, details),
  debug: (message: string, ...details: unknown[]) => write('debug', message, details),
  verbose: (message: string, ...details: unknown[]) => write('verbose', message, details),
  info: (message: string, ...details: unknown[]) => write('info', message, details),
  warn: (message: string, ...details: unknown[]) => write('warn', message, details),
  error: (message: string, ...details: unknown[]) => write('error', message, details),
};
