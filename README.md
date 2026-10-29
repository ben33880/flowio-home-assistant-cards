# Flow.io Home Assistant Cards

Cartes de supervision et de pilotage de piscine pour Home Assistant, destinées à une distribution frontend via HACS.

## État du projet

Projet en cours de création. Ce premier commit définit le périmètre ; aucune carte fonctionnelle ni release installable n'est encore fournie.

## Objectifs

- Interface professionnelle, responsive et adaptée au thème Home Assistant actif, clair ou sombre.
- Configuration graphique des entités et des équipements réellement installés.
- Traitement configurable : chlore/brome liquide, électrolyse, oxygène actif ou aucun.
- Correction pH indépendante du traitement.
- Sections optionnelles : chauffage, robot, éclairage, remplissage, cuves, historiques et diagnostics.
- Consultation des détails au clic et commandes clairement séparées de la consultation.
- Prise en charge des états indisponibles sans les convertir en zéro.

## Architecture prévue

- TypeScript et composants Lit.
- Cartes personnalisées composables dans les dashboards Home Assistant.
- Éditeur visuel des associations d'entités et des options d'affichage.
- Manifest HACS et exemples YAML.
- Tests de configuration et de rendu.
- Aucune dépendance obligatoire à Mushroom, card-mod ou à un thème particulier.

## Données et commandes

Les cartes utiliseront les états, attributs et actions des entités Home Assistant exposées par Flow.io via MQTT Discovery. Elles ne se connecteront pas directement au broker et ne demanderont aucun identifiant MQTT dans le navigateur.

Les associations d'entités seront configurables : aucun préfixe fio ni identifiant historique ne sera obligatoire. Les correspondances devront être validées contre les entités effectivement présentes dans Home Assistant.

## Traitement et sécurité

La sélection du traitement dans la présentation ne modifiera pas silencieusement la configuration du contrôleur. Un mode automatique pourra suivre l'entité de type de désinfection associée ; un choix manuel incohérent devra être signalé.

Les équipements absents pourront être masqués, mais les alarmes actives ne devront pas disparaître du fait d'un filtre de présentation. Les sécurités et validations des commandes resteront sous la responsabilité du firmware Flow.io.

## Première version prévue

1. Synthèse de piscine et mesures essentielles.
2. Filtration et équipements optionnels.
3. Traitement adapté à l'installation.
4. Alarmes et détails des entités.
5. Éditeur graphique et exemples de dashboards.

Le dépôt firmware Flow.io-Waveshare reste indépendant et n'est pas modifié par ce projet.
