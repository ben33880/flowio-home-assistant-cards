# Changelog

## 0.3.3 — en préparation

- Icône « Système » native HA placée près du titre, avec infobulle, style Flow.io accordé au thème et icônes issues des entités firmware dans le dialogue ; le signal Wi-Fi n’apparaît que s’il est disponible.
- Tension (V) et courant (A) ajoutés au diagnostic système depuis le slot d’équipement configuré.
- Actions de remplissage pH/désinfectant placées en icônes à infobulle à côté des jauges de cuves correspondantes.
- Remises à zéro des durées de filtration, pH et désinfection placées sous leurs compteurs dans « Horaires & durées » ; leur durée est ajoutée à l’affichage si nécessaire.
- Toutes les options des paramètres de chaque carte sont sélectionnées par défaut ; l’utilisateur peut décocher les éléments inutiles.
- Pourcentage des cuves agrandi ; volume restant et action de remplissage alignés au pied des jauges.
- Forçage temporaire placé dans la section Filtration de « Horaires & durées », avec un bouton harmonisé.
- Les nouvelles cartes occupent toute la largeur d’une vue Sections par défaut.
- Titre par défaut raccourci à « Supervision » ; bouton Système redessiné plus discret et fiabilisé pour le toucher sur mobile.
- Type de traitement déduit de `select.<préfixe>_pl_modes_dis`, sans réglage manuel redondant ; les modes, les équipements, les injections et les actions suivent le mode firmware actif.
- Routage distinct des commandes électrolyseur et désinfection chimique. En mode inconnu ou désactivé, les commandes dépendantes du traitement sont indisponibles. L’ancien `display.treatment` est accepté mais ignoré.
- Switch autonome Électrolyseur retiré des équipements ; « Pompe désinfectant » pilote l’électrolyseur en mode « Electrolyse », la pompe désinfectant pour « Chlore/Brome » ou « Oxygène actif ».
- Libellé de la mesure dans « Qualité de l’eau » fixé à « ORP », indépendamment du traitement actif.
- En mode électrolyse, la remise à zéro désinfection cible le compteur électrolyseur ; remplissage et estimation d’injection désinfectant masqués.
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
