trigger: glob
globs: "frontend/src/**/*.{ts,tsx}"
---
# Standards de Code Frontend (Niveau Senior)

- **Architecture App Router** : Respecter la séparation stricte entre les Server Components (récupération de données, SEO) et les Client Components (`"use client"`, limités à l'interactivité pure).
- **Fonctions claires** : Principe de responsabilité unique (KISS). Extraire la logique métier complexe dans des hooks personnalisés (`src/hooks/`) ou des utilitaires (`src/utils/`).
- **Gestion des erreurs robuste** : Sécuriser chaque appel API avec un `try/catch`. Remonter une erreur claire et professionnelle à l'utilisateur, et logger l'erreur technique proprement pour le développeur.
- **Code mort et nettoyage** : Supprimer systématiquement les imports inutilisés, les `console.log` de test et le code mort avant de terminer une tâche.