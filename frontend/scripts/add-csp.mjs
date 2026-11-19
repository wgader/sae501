// Ajoute une Content-Security-Policy à chaque page de l'export statique (dossier out/).
//
// Sans serveur Node, Next.js ne peut plus poser de nonce sur ses scripts. On autorise donc ses
// scripts en ligne par leur empreinte SHA-256 : un script injecté par une faille XSS n'a pas
// d'empreinte connue et le navigateur refuse de l'exécuter.
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = fileURLToPath(new URL('../out/', import.meta.url));
const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

// frame-ancestors est ignoré dans une balise <meta> : Caddy l'envoie en en-tête HTTP.
const policyFor = (hashes) =>
  [
    "default-src 'self'",
    `script-src 'self' ${hashes.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

let pages = 0;
for await (const file of htmlFiles(OUT_DIR)) {
  const html = await readFile(file, 'utf8');
  const hashes = [...new Set(
    [...html.matchAll(INLINE_SCRIPT)].map(([, body]) => `'sha256-${createHash('sha256').update(body).digest('base64')}'`),
  )];
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policyFor(hashes)}"/>`;
  await writeFile(file, html.replace('<head>', `<head>${meta}`));
  pages += 1;
}

console.log(`CSP ajoutée à ${pages} pages.`);
