trigger: manual
---
# Workflow Git et Branching (SAE501)

1. **Branche de départ** : Toujours vérifier que l'on part de `develop` et qu'elle est à jour (`git pull origin develop`).
2. **Nouvelle fonctionnalité** : Créer une branche nommée `feature/<nom-de-la-feature>`.
3. **Commits** : 
   - Utiliser la norme Conventional Commits (ex: `feat(back): configure JWT auth`).
   - `feat:` (nouveauté), `fix:` (bug), `chore:` (config), `docs:` (documentation), `refactor:` (nettoyage).
4. **Pull Request** : Ouvrir la PR sur GitHub avec `develop` comme base.
5. **Release** : La fusion vers `main` se fait uniquement depuis `develop` avec un tag de version `v*.*.*`.