# Développement du format par préfixe

Node.js 24 via .nvmrc. Utiliser nvm install puis nvm use, npm install, npm test et npm run build. Pour les tests Chromium : npx playwright install chromium puis npm run test:e2e. Le lockfile reste à générer avant de passer à npm ci.

## Configuration unique

Il n'existe plus de configuration manuelle des identifiants. Les deux cartes utilisent entity_prefix (fio par défaut) et les suffixes de src/entities.ts. L'ancien champ entities déclenche une erreur explicite. Les exemples YAML et la démonstration utilisent uniquement le nouveau format.

Les éditeurs proposent préfixe, mesures métier, traitement et équipements ; la synthèse offre aussi les slots des cuves. Les configurations sérialisées ne contiennent aucun identifiant d'entité complet. Les objets entities des cartes graphiques natives sont une projection interne, pas une option publique des cartes Flow.io.

## Essai dans Home Assistant

Après publication du nouveau bundle et rechargement de la ressource, remplacer les anciennes configurations avec examples/pool.yaml ou examples/dashboard-chlorine.yaml. Ne pas attendre une migration automatique. Vérifier le préfixe identique à celui du firmware, ouvrir Configuration pour lire les identifiants attendus, puis contrôler les slots et la diffusion des cuves.

Une entité absente n'est jamais remplacée par un nom ressemblant. Un état indisponible n'est pas converti en zéro. Les commandes de dosage/démarrage demandent confirmation et les commandes réelles restent validées par le firmware. Tester d'abord les consultations, sans actionner d'équipement.

La CI reconstruit le bundle après les tests et publie dist/flowio-home-assistant-cards.js sur main. Les tags et releases déjà publiés ne sont ni modifiés ni remplacés ; une nouvelle publication beta est nécessaire pour distribuer cette refonte par release. Les tests simulés ne garantissent pas le rendu de ha-form ou des graphiques natifs dans toutes les versions HA.
