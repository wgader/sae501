---
description: Standards de tests PHPUnit pour chaque contrôleur Symfony et ressource API Platform.
globs: "backend/src/Controller/**/*.php,backend/src/Entity/**/*.php"
---
# Tests des contrôleurs et ressources backend

Lors de la création ou modification d'un contrôleur Symfony ou d'une entité `#[ApiResource]`,
créer ou mettre à jour dans le même changement une classe correspondante sous
`backend/tests/Controller/`.

- Les tests de contrôleur étendent `App\Tests\Controller\ControllerRouteTestCase`.
- Couvrir les cas nominaux et les erreurs métier importantes de chaque action publique,
  notamment l'authentification, l'autorisation, la validation et les codes HTTP attendus.
- Chaque ressource API Platform possède une classe de test dédiée couvrant sa route de collection.
- Utiliser des requêtes HTTP de `WebTestCase` pour tester le comportement, l'authentification,
  les autorisations, la validation et les réponses JSON. Une simple vérification d'enregistrement
  de route ne constitue pas un test suffisant.
- Exécuter `cd backend; php bin/phpunit` (ou `vendor/bin/phpunit`) et indiquer le résultat exact.
- Ne pas supprimer ni affaiblir un test d'endpoint existant lors de l'ajout d'un contrôleur ou d'une ressource.
