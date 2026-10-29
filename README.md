# Flow.io Home Assistant Cards

Cartes configurables de piscine en TypeScript et Lit, destinées à HACS. Version de développement : aucune release installable publiée par ce lot.

## Cartes

### custom:flowio-pool-card

Synthèse, mesures, commandes explicites et état global des alarmes. Traitement affiché configurable : chlore/brome liquide, électrolyse, oxygène actif, aucun ou suivi du sélecteur Flow.io. Filtration, correction pH, chauffage, robot, éclairage, remplissage et cuves estimées sont optionnels. Les associations d'entités sont configurables dans l'éditeur visuel.

Le traitement de présentation ne modifie jamais le contrôleur. Un désaccord connu désactive les commandes de désinfection de la carte. Les sécurités restent dans le firmware. Un état de sortie ne prouve pas le fonctionnement physique.

### custom:flowio-history-card

Carte d'historiques avec éditeur visuel : jusqu'à six mesures sensor/number, durée entière de 1 à 168 heures et titre configurable. Un graphique natif history-graph est créé pour chaque mesure : les unités et échelles ne sont pas mélangées. Aucun nouveau stockage ni token MQTT.

Les données proviennent de Home Assistant, avec sa politique de conservation et ses permissions. Une entité exclue du Recorder n'a pas d'historique. La carte ne change pas cette configuration et ne fabrique pas de courbes.

```yaml
type: custom:flowio-history-card
title: Qualité de l’eau
hours_to_show: 24
entities:
  - sensor.fio_io_wat_tmp
  - sensor.fio_io_ph
  - sensor.fio_io_orp
```

Vérifier les identifiants dans votre instance. examples/dashboard-chlorine.yaml fournit un dashboard Sections avec pilotage chlore et historiques. Les associations de la carte d'historique sont indépendantes de celles de la carte de pilotage.

## Environnement

Node.js 24 via .nvmrc et engines >=24 <25. La CI conserve ubuntu-24.04 et les actions checkout/setup-node/upload-artifact en v6. Ces choix évitent une migration implicite de version majeure, pas les mises à jour des images ou dépendances.

```sh
nvm install
nvm use
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Le point d'entrée src/index.ts regroupe les cartes dans un seul bundle : dist/flowio-home-assistant-cards.js. Lit est inclus ; aucun CDN ni extension Mushroom/card-mod nécessaire. Le lockfile reste à générer et versionner avant de passer à npm ci.

## Aperçu et validation

Lancer npm run demo et ouvrir http://127.0.0.1:4173/demo/. L'aperçu de pilotage utilise uniquement des données fictives et journalise les commandes localement. Ses palettes fixes simulent des thèmes ; les cartes de production héritent des variables HA. Il n'exécute pas les graphiques natifs Home Assistant.

Tests unitaires : configuration, traitements, disponibilité et projection des historiques. Tests Chromium : pilotage simulé, événements d'éditeur, captures clair/sombre mobile/ordinateur ; les nouveaux tests d'historique utilisent des helpers natifs simulés pour vérifier leur configuration, mise à jour et gestion d'erreurs. Ils ne valident pas le moteur graphique natif ni les sélecteurs ha-form réels. Les captures ne sont pas des comparaisons de régression visuelle.

La CI précédente a été signalée réussie par l'utilisateur. Le présent lot doit repasser la CI ; aucun nouveau succès ni essai HA réel n'est présumé.

## Installation et suite

Consulter docs/DEVELOPMENT.md pour l'essai manuel. Le manifeste HACS est présent ; un artefact Actions seul ne rend pas le dépôt installable HACS. Le bundle doit encore être distribué dans une release ou dist après validation. Aucune release ni modification du firmware n'est effectuée ici.

Suite : cartes spécialisées, alarmes détaillées, planification O2, forçages temporaires et consignes variables.
