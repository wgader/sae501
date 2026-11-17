import { NextResponse, type NextRequest } from 'next/server';

const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL || 'http://localhost').origin;
const isDev = process.env.NODE_ENV === 'development';
const isHttpsApi = apiOrigin.startsWith('https:');

/**
 * Politique de sécurité du site, avec un nonce neuf à chaque requête : seuls les scripts de
 * Next.js, qui reçoivent ce nonce, s'exécutent. Un script injecté par une faille XSS n'a pas le
 * nonce et est bloqué. Les styles restent autorisés en ligne (attributs style de React).
 */
function contentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' blob: data: ${apiOrigin}`,
    "font-src 'self'",
    `connect-src 'self' ${apiOrigin}${isDev ? ' ws:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isHttpsApi ? ['upgrade-insecure-requests'] : []),
  ].join('; ');
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const policy = contentSecurityPolicy(nonce);

  // Next.js lit le nonce dans l'en-tête CSP de la requête et l'applique à ses propres scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', policy);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

export const config = {
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|favicon.ico|assets|uploads).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
