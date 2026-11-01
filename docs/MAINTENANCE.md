# Menu Maintenance — développement

Branche : `feature/maintenance-menu`.

## Interface prévue

Le bouton Maintenance doit remplacer le bouton Forçage temporaire au même emplacement et avec la même présentation. La popup Maintenance doit contenir une section Alarmes et une section Forçage reprenant les commandes existantes. La clé `display.operations: [timed_override]` reste compatible.

Cette première étape ajoute uniquement la couche MQTT et ses tests unitaires ; elle ne raccorde pas encore la popup ni son interrupteur. Les tests ajoutés ne sont pas annoncés comme exécutés.

## Contrat firmware

Référence : `christophebelmont/Flow.io-Waveshare`, fichiers `docs/core/mqtt-topics.md`, `docs/modules/AlarmModule.md` et `src/Modules/AlarmModule/AlarmModule.cpp`.

- Topic racine explicite : `<baseTopic>/<deviceId>`, indépendant du préfixe des entités HA.
- Configuration : `<racine>/cfg/alarms`, booléen `enabled`.
- Disponibilité : `<racine>/status`, booléen `online`.
- Commande : `<racine>/cfg/set`, patch `{"alarms":{"enabled":false}}` ou `true`, via `mqtt.publish`, QoS 1 et `retain: false`.
- Le retour de configuration, et non la seule réussite du service de publication, confirme l’état affiché. Un délai sans confirmation invalide l’état et bloque une nouvelle commande jusqu’à relecture.

Le booléen est global : il suspend ou réactive l’évaluation du moteur d’alarmes. Il n’acquitte pas les alarmes mémorisées et ne garantit pas la levée des interlocks. Aucun reset d’alarme n’est envoyé par cette fonction. La future interface doit demander confirmation avant désactivation et expliquer cette conséquence.

## Contraintes Home Assistant

La lecture utilise l’API WebSocket `mqtt/subscribe` sur deux topics exacts, sans joker. Dans le code Home Assistant consulté, cette API exige un utilisateur administrateur. L’intégration MQTT et les droits de publication doivent être disponibles. La couche MQTT ne décide pas des confirmations utilisateur : elles doivent être implémentées dans la popup avant tout appel à `setEnabled`. Les souscriptions doivent être fermées avec le dialogue et lors d’un changement de contrôleur.

Aucun contrôleur réel n’est commandé par les tests unitaires. Aucun tag ou artefact de release n’est créé par cette étape.
