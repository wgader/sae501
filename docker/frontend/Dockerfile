FROM node:26-alpine AS deps
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --frozen-lockfile

FROM node:26-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ .
ARG NEXT_PUBLIC_API_URL=http://localhost
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

FROM node:26-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# Le serveur standalone n’a besoin que de node : npm, npx, corepack et yarn sont retirés de
# l’image finale (dépendances vulnérables signalées par Trivy, outils inutiles à un attaquant).
# Correctifs de sécurité Alpine publiés après l’image de base (musl, zlib…).
RUN apk upgrade --no-cache \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs \
 && rm -rf /usr/local/lib/node_modules /opt/yarn-* \
    /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static     ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public           ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
