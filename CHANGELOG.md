# Changelog

## 0.3.3 — en préparation

- Icône « Système » native HA placée près du titre, avec infobulle, style Flow.io accordé au thème et icônes issues des entités firmware dans le dialogue ; le signal Wi-Fi n’apparaît que s’il est disponible.
- Tension (V) et courant (A) ajoutés au diagnostic système depuis le slot d’équipement configuré.
- Actions de remplissage pH/désinfectant placées en icônes à infobulle à côté des jauges de cuves correspondantes.
- Remises à zéro des durées de filtration, pH et désinfection placées sous leurs compteurs dans « Horaires & durées » ; leur durée est ajoutée à l’affichage si nécessaire.
- Toutes les options des paramètres de chaque carte sont sélectionnées par défaut ; l’utilisateur peut décocher les éléments inutiles.
- Choix exclusif du traitement affiché sur ORP : Désactivé, Électrolyseur, Chlore/Brome ou Oxygène actif (Chlore/Brome par défaut) ; la sélection seule ne commande pas le firmware.
- Switch autonome Électrolyseur retiré des équipements ; « Pompe désinfectant » pilote l’électrolyseur lorsque ce traitement est sélectionné.
- Libellé de la mesure dans « Qualité de l’eau » fixé à « ORP », indépendamment du traitement affiché dans l’en-tête.
- En mode électrolyse, l’action de remise à zéro de la durée désinfection cible le compteur de l’électrolyseur ; l’action de remplissage désinfectant est masquée.
- Détails : [notes de release 0.3.3](docs/releases/v0.3.3.md).

## 0.3.2 — construite

- Libellé « Injecté aujourd’hui · estimé » déplacé sous chaque jauge pH/ORP correspondante.
- Détails : [notes de release 0.3.2](docs/releases/v0.3.2.md).

## 0.3.1 — en préparation

- Jauges agrandies et estimations d'injection placées sous la jauge correspondante.
- Détails : [notes de release 0.3.1](docs/releases/v0.3.1.md).

## 0.3.0 — en préparation

- Espacements et alignements uniformisés entre les sections, cuves rapprochées des équipements et section Horaires remontée.
- Titres Supervision et Historique harmonisés, icônes mises en valeur et badge d'alarme vert à zéro / rouge clignotant en cas d'alarme.
- Diagnostic de configuration masqué en l'absence d'entités manquantes.
- Détails : [notes de release 0.3.0](docs/releases/v0.3.0.md).

## 0.2.0

- Entête native compacte avec traitement et compteur d'alarmes.
- Jauges compactes et durées intégrées à la frise de filtration.
- Estimations d'injection et configuration étendue des équipements, cuves et diagnostics.
- Notes : [release 0.2.0](docs/releases/v0.2.0.md).

## 0.1.0

- Première version stable ; voir [notes de release 0.1.0](docs/releases/v0.1.0.md).
