trigger: model_decision
description: À lire avant de terminer une tâche, de valider une fonctionnalité métier ou de préparer un commit.
---
# Tests Automatisés

Un code de niveau senior n'est jamais livré sans tests automatisés. 
- Exiger l'écriture de tests fonctionnels avec PHPUnit pour chaque nouvel endpoint API Platform.
- Vérifier systématiquement les différents cas d'usage et codes de retour HTTP (200, 401, 403, 404, 422).
- Ne jamais affaiblir un test : si un test révèle un bug, il faut corriger le code métier, pas le test.