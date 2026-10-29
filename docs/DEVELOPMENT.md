# Développement

Node.js 24 via .nvmrc. Utiliser nvm install, nvm use, npm ci, npm test et npm run build. Pour Chromium : npx playwright install chromium puis npm run test:e2e. Le lockfile versionné garantit l'installation des versions résolues ; après une modification volontaire des dépendances, le régénérer et le revoir avec le workflow manuel avant de fusionner.

Les captures de référence du README sont vérifiées par Playwright dans `e2e/readme-snapshots.spec.ts` et stockées dans `docs/`. Pour les actualiser après un changement visuel intentionnel, exécuter `npx playwright test e2e/readme-snapshots.spec.ts --update-snapshots`, puis revoir et versionner les images avec les changements de code.

La synthèse accepte uniquement le format entity_prefix + display + tank_slots, sans anciens champs ni associations manuelles. Voir examples/pool.yaml et docs/DISPLAY.md. Les suffixes firmware et rôles métier sont centralisés dans src/entities.ts. Les historiques conservent leur format entity_prefix + measurements.

Le traitement annoncé n'est qu'une information facultative. Ne pas réintroduire de masquage ou de verrou de commande par reconnaissance de son libellé. Les actions exigent un équipement sélectionné, une entité on/off disponible et la confirmation de démarrage sensible ; l'autorisation opérationnelle reste dans Flow.io. Aucune commande n'est exécutée par les tests ou la démo sur du matériel réel.

Lancer npm run demo puis ouvrir http://127.0.0.1:4173/demo/. Les états fictifs et le journal de commandes permettent de contrôler que modifier l'état de traitement ne change pas les sélections affichées. Les composants graphiques et sélecteurs HA réels ne sont pas reproduits par les tests.

Après réussite de check et publish-dist, installer le bundle main actualisé et remplacer les anciennes configurations, sans attendre de migration. Les releases existantes restent inchangées ; une nouvelle beta doit être publiée pour distribuer le nouveau format par release. Les clics de commande dans une vraie instance peuvent actionner la piscine : commencer par vérifier préfixe, entités et slots sans commander d'équipement. Le firmware n'est pas modifié.
