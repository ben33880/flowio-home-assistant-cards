# Menu Maintenance

Branche : `feature/maintenance-menu`.

## Interface

Le bouton Maintenance remplace le bouton Forçage temporaire au même emplacement, dans Filtration sous Horaires & durées, avec la même présentation. La popup Maintenance contient une section Alarmes et une section Forçage reprenant le formulaire, les commandes et les confirmations existants. La clé `display.operations: [timed_override]` et les anciens événements internes restent compatibles.

Dans Alarmes, saisir le topic racine exact `<baseTopic>/<deviceId>` puis cliquer sur Lire l’état MQTT. Le topic est conservé uniquement en mémoire tant que cette carte reste montée ; il n’est pas enregistré dans le YAML. Il est effacé au changement de préfixe HA. Il n’est jamais déduit automatiquement du préfixe des entités. La configuration du contrôleur est globale et persistante côté firmware, indépendamment de cette saisie locale.

L’interrupteur Évaluation des alarmes est bloqué tant que l’état est inconnu, que le contrôleur n’est pas confirmé en ligne, qu’une commande attend confirmation ou que les droits MQTT manquent. La désactivation et la réactivation demandent confirmation. Le contrôle garde le dernier état reçu jusqu’au retour firmware ; la seule réussite du service de publication ne suffit pas. Les commandes de forçage sont bloquées pendant la lecture ou la modification des alarmes. Les contrôles MQTT sont bloqués pendant une commande ou une confirmation de forçage.

La fermeture du dialogue retire les souscriptions et invalide les callbacks en cours ; elle n’annule pas une commande MQTT déjà transmise au firmware. Un avertissement rappelle de réactiver les alarmes lorsque leur évaluation est désactivée.

## Contrat firmware

Référence : `christophebelmont/Flow.io-Waveshare`, fichiers `docs/core/mqtt-topics.md`, `docs/modules/AlarmModule.md` et `src/Modules/AlarmModule/AlarmModule.cpp`.

- Configuration : `<racine>/cfg/alarms`, booléen `enabled`.
- Disponibilité : `<racine>/status`, booléen `online`.
- Commande : `<racine>/cfg/set`, patch `{"alarms":{"enabled":false}}` ou `true`, via `mqtt.publish`, QoS 1 et `retain: false`.
- Un délai sans confirmation invalide l’état et impose une relecture avant une nouvelle commande.

Le booléen est global : il suspend ou réactive l’évaluation du moteur d’alarmes. Il n’acquitte pas les alarmes mémorisées et ne garantit pas la levée des interlocks. Aucun reset d’alarme n’est envoyé par cette fonction.

## Contraintes et validation

La lecture utilise l’API WebSocket `mqtt/subscribe` sur deux topics exacts, sans joker. Dans le code Home Assistant consulté, cette API exige un utilisateur administrateur. L’intégration MQTT et les droits de publication doivent être disponibles.

Tests ajoutés : `src/maintenance-mqtt.test.ts` pour le protocole et `e2e/maintenance.spec.ts` pour la popup à 390 et 1100 px, la confirmation, le retour d’état et le nettoyage. Ces tests utilisent des simulations et ne commandent aucun matériel réel. Ils ne sont pas annoncés comme exécutés. Exécuter `npm run check`, `npm test`, les tests navigateur ciblés puis la suite complète avant fusion. Vérifier ensuite le comportement dans Home Assistant réel.

Aucun tag ou artefact de release n’est créé par cette modification.
