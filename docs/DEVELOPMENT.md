# Développement et essai manuel

## Environnement

Utiliser Node.js 24. La version majeure est définie dans .nvmrc ; package.json déclare >=24 <25. Avec nvm, exécuter nvm install puis nvm use. Les correctifs de la branche 24 ne sont pas figés.

La CI utilise runs-on: ubuntu-24.04 plutôt que ubuntu-latest pour éviter une migration implicite du système. L'image hébergée continue à recevoir ses mises à jour ; ce label ne garantit pas une reproductibilité octet par octet.

## Commandes

```sh
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Le lockfile reste à générer et versionner. Tant qu'il est absent, la CI utilise npm install et non npm ci.

Le build produit dist/flowio-home-assistant-cards.js avec Lit inclus, sans CDN. La CI conserve le bundle après réussite de toutes les vérifications et joint un rapport navigateur avec les captures. Vérifier les résultats dans GitHub Actions ; aucun succès n'est présumé.

## Démonstration isolée

Lancer npm run demo puis ouvrir http://127.0.0.1:4173/demo/. Les entités et les actions sont simulées. Le serveur écoute uniquement sur la boucle locale. Les tests Chromium vérifient le composant compilé, pas une instance complète de Home Assistant. Le scénario d'éditeur injecte un événement value-changed ; il ne valide pas les sélecteurs ha-form réels.

## Essai dans Home Assistant

1. Copier le bundle compilé dans config/www/flowio/flowio-home-assistant-cards.js.
2. Déclarer /local/flowio/flowio-home-assistant-cards.js?v=0.1.0-dev comme ressource JavaScript module.
3. Ajouter la carte Flow.io Piscine et ouvrir son éditeur visuel.
4. Associer les entités réelles ; examples/pool.yaml ne détecte pas votre installation.
5. Vérifier thème clair/sombre, mobile, droits utilisateur, entités absentes, indisponibilité et commandes refusées.

Les commandes de cet essai peuvent agir sur la vraie installation. Ne pas cliquer sur les actionneurs sans vérifier les associations et les conditions de fonctionnement. Les sécurités restent dans le firmware ; une commande acceptée ou un état de sortie ne confirme pas physiquement le fonctionnement.

## Distribution HACS

Le manifeste est présent, mais aucun bundle n'est encore publié dans une release ou versionné dans dist par ce commit. Un artefact Actions seul n'est pas un paquet installable HACS. Après validation de la CI et de l'essai HA, distribuer le bundle portant exactement le nom flowio-home-assistant-cards.js. Aucune release n'est créée automatiquement.
