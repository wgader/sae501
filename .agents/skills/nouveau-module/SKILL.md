name: nouveau-module
description: Crée un nouveau module métier de bout en bout (Subventions, Salles, ou Matériel). À utiliser quand on demande de développer une nouvelle fonctionnalité de la plateforme.
---
# Création d'un module SAE501

## Étapes de développement

1. **Planification** : 
   - Présenter un plan détaillant l'entité Doctrine (`backend/src/Entity/`), la ressource API Platform (`backend/src/ApiResource/`), et les vues Next.js correspondantes.
   - Prendre en compte les spécificités (ex: subventions annuelles vs exceptionnelles, gestion des créneaux de salles)[cite: 3, 4].
   - Attendre la validation de l'utilisateur.

2. **Backend (Symfony 8.1)** :
   - Créer l'entité Doctrine avec ses attributs et générer la migration. **Inspire-toi de la structure et de la rigueur du fichier `examples/UserEntity.php` pour générer le code de la nouvelle entité.**
   - Créer la classe dans `ApiResource/` pour exposer les endpoints nécessaires en appliquant les règles de sécurité (Mairie vs Associations)[cite: 4].

3. **Frontend (Next.js 16)** :
   - Créer les vues en respectant l'architecture App Router et Tailwind CSS.
   - Connecter les formulaires de demande et les tableaux de bord à l'API[cite: 3].

4. **Vérification et Compte rendu** : 
   - S'assurer que le code respecte les règles de qualité du projet.
   - Rendre un compte rendu listant les fichiers créés et les endpoints générés.