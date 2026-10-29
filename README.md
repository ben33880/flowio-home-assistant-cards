# Flow.io Home Assistant Cards

Première carte de piscine configurable pour Home Assistant, en TypeScript et Lit. Projet de développement destiné à HACS ; aucune release installable n'est encore publiée.

## Présent dans les sources

- `custom:flowio-pool-card` et éditeur visuel avec associations d'entités.
- Traitement affiché : chlore/brome liquide, électrolyse, oxygène actif, aucun ou suivi automatique du sélecteur Flow.io.
- Filtration, correction pH, chauffage, robot, éclairage et remplissage optionnels.
- Mesures, consignes consultables via more-info, cuves estimées optionnelles et état global des alarmes.
- Commandes explicites via Home Assistant, confirmation pour dosage/remplissage et avertissement si le traitement affiché diffère du contrôleur.
- Styles utilisant le thème actif, sans Mushroom, card-mod ni connexion directe au broker.

La présentation ne modifie jamais silencieusement le traitement du contrôleur. Les sécurités restent gérées par Flow.io. Aucun équipement réel n'est commandé par les tests ou la démonstration.

## Développement et aperçu

Node.js 24 est la version du projet, définie dans .nvmrc et package.json. La CI utilise explicitement ubuntu-24.04 pour éviter les migrations implicites de ubuntu-latest. Cela ne fige pas les mises à jour de l'image runner ni les dépendances npm.

```sh
nvm install
nvm use
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Pour ouvrir l'aperçu simulé :

```sh
npm run demo
```

Ouvrir `http://127.0.0.1:4173/demo/`. L'aperçu permet de changer le traitement, le thème et de simuler une indisponibilité. Toutes les mesures sont fictives et les commandes restent dans un journal local. Les couleurs fixes de cette page simulent deux thèmes ; la carte de production utilise les variables du thème HA.

## Validation

Les tests unitaires couvrent le modèle. Playwright teste le bundle dans Chromium avec un objet hass simulé : filtrage des traitements, commandes, annulation d'une confirmation, alarmes, indisponibilité, propagation de configuration et captures à 390/1440 pixels en clair/sombre. La CI joint les captures à son rapport HTML.

Ces captures ne sont pas des tests de régression par comparaison à des références. Les composants internes HA de l'éditeur ne sont pas reproduits : le test vérifie son événement de configuration, pas le fonctionnement réel des sélecteurs ha-form. Aucun résultat de test n'est présumé ; consulter GitHub Actions. Un essai dans Home Assistant reste indispensable.

## Distribution

Le manifeste `hacs.json` est fourni. La CI prépare un bundle en artefact si les vérifications passent ; un artefact Actions n'est pas une release HACS. Il reste à distribuer le bundle `flowio-home-assistant-cards.js` dans une release ou dans dist après validation.

Consulter `docs/DEVELOPMENT.md` et `examples/pool.yaml` pour l'essai manuel. Les identifiants de l'exemple doivent être vérifiés dans votre instance. Le lockfile reste à générer et versionner ; les installations ne sont pas encore figées.

## Suite prévue

Graphiques, cartes spécialisées, liste détaillée d'alarmes, planification O2, forçages temporaires et réglages des appareils à consigne variable. Le firmware Flow.io-Waveshare reste indépendant et n'est pas modifié.
