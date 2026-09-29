trigger: model_decision
description: À appliquer dès qu'on crée ou modifie un endpoint d'API, une ressource, ou une action utilisateur nécessitant des permissions.
---
# Sécurité et Rôles

Le projet sépare strictement les accès entre la "Mairie" (qui administre et valide) et les "Associations" (qui formulent et suivent leurs demandes)[cite: 4].
- Chaque route API Platform doit vérifier le token JWT.
- Bloquer l'écriture, la modification et la suppression si l'utilisateur n'est pas le propriétaire de la ressource (l'association elle-même) ou s'il n'a pas le rôle administrateur (`ROLE_MAIRIE`)[cite: 4].
- Les modules (subventions, matériel, salles) doivent vérifier si la Mairie a activé l'accès pour l'association concernée[cite: 4].