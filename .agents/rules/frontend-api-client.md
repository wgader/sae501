---
trigger: glob
globs: "frontend/src/lib/api.ts,frontend/src/lib/api/**/*.ts"
description: "Architecture modulaire du client API frontend : conserver les domaines séparés et la façade de réexports."
---
# Client API frontend

- Conserver le découpage par domaine dans [`frontend/src/lib/api/`](../../frontend/src/lib/api/).
- Placer chaque nouvelle fonctionnalité dans le module correspondant à son domaine (`associations.ts`, `materiel.ts`, `evenements.ts`, `salles.ts`, `auth.ts`, `agents.ts` ou un nouveau module métier).
- Garder [`frontend/src/lib/api.ts`](../../frontend/src/lib/api.ts) comme façade publique de réexports uniquement. Ne pas y ajouter d'implémentation métier ou de nouvelle fonction HTTP.
- Mettre les types partagés dans [`frontend/src/lib/api/types.ts`](../../frontend/src/lib/api/types.ts) et les primitives HTTP communes dans [`frontend/src/lib/api/client.ts`](../../frontend/src/lib/api/client.ts).
- Réutiliser `request`, `accountRequest`, `ApiError` et `API_URL` au lieu de dupliquer la gestion des tokens, des erreurs et des réponses HTTP.
- Avant d'ajouter un endpoint, vérifier le domaine fonctionnel et compléter le module existant ; créer un module seulement si le domaine est réellement distinct.
- Après toute modification du client API, lancer au minimum `npm --prefix frontend run lint` et `npm --prefix frontend exec -- tsc --noEmit`.
