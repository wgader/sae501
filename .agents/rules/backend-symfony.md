---
description: Standards pour le développement Backend (Symfony 8.1, API Platform, Doctrine, Tests).
globs: "backend/src/**/*"
---
# Standards de Code Backend (Symfony 8.1)

## Architecture Stricte
- Garder les Contrôleurs et les Ressources API Platform extrêmement fins.
- Déplacer systématiquement la logique métier ou les traitements complexes dans des classes de Service dédiées (`backend/src/Service/`).
- Typage strict obligatoire pour les paramètres et les types de retour de chaque fonction.

## Sécurité et Rôles (Mairie vs Associations)
Le projet sépare strictement les accès entre la "Mairie" (qui administre et valide) et les "Associations" (qui formulent et suivent leurs demandes).
- Chaque route API Platform doit vérifier la présence et la validité du token JWT.
- **Contrôle d'accès** : Bloquer l'écriture, la modification et la suppression (403 Forbidden) si l'utilisateur n'est pas le propriétaire de la ressource (l'association elle-même) OU s'il n'a pas le rôle administrateur (`ROLE_MAIRIE`).
- Vérifier systématiquement que la Mairie a activé l'accès pour l'association concernée avant de traiter une demande (modules subventions, matériel, salles).

## Gestion des Erreurs
- Ne jamais avaler les erreurs silencieusement.
- Créer et lancer des exceptions métier explicites accompagnées des bons codes statuts HTTP (400, 403, 404, 422).

## Tests Automatisés (PHPUnit)
Un code backend n'est jamais livré sans tests automatisés.
- Écrire des tests fonctionnels via PHPUnit pour **chaque nouvel endpoint API Platform**.
- Vérifier systématiquement les différents cas d'usage, rôles (Mairie/Asso) et codes de retour HTTP (200, 401, 403, 404, 422).
- Ne jamais affaiblir un test : si un test révèle un bug, il faut corriger le code métier, pas le test.