trigger: glob
globs: "backend/src/**/*.php"
---
# Standards de Code Backend (Niveau Senior)

- **Architecture stricte** : Garder les contrôleurs et les ressources API Platform extrêmement fins. Déplacer systématiquement la logique métier ou les traitements complexes dans des classes de Service dédiées (`backend/src/Service/`).
- **Gestion des erreurs lisible** : Ne jamais avaler les erreurs silencieusement. Créer et lancer des exceptions métier explicites accompagnées des bons codes statuts HTTP (400, 403, 404, 422).
- **Clean Code & Concision** : 
  - Aucun code mort, variable non utilisée, ou code mis en commentaire ne doit être conservé.
  - Privilégier les "early returns" (sorties précoces) pour éviter les imbrications complexes de `if/else`.
  - Typage strict obligatoire (paramètres et types de retour).
- **Documentation et Lisibilité** : Les noms de variables, méthodes et classes doivent être auto-descriptifs et en anglais. Commenter uniquement le "pourquoi" (les décisions métier), pas le "comment".