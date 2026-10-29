# Choix d'affichage explicites

La carte principale utilise entity_prefix et display. Aucun mode de traitement ne décide des blocs affichés. L'utilisateur sélectionne ses mesures, consignes, équipements, valeurs de cuve et informations.

## Options

- display.measurements : water_temperature, air_temperature, ph, orp, pressure.
- display.setpoints : ph_setpoint, orp_setpoint. La consigne de désinfection est ORP, pas une concentration en chlore.
- display.equipment : filtration, ph_pump, disinfection_pump, electrolyzer, heater, robot, lighting, filling.
- display.tanks : ph_tank, ph_tank_percent, disinfection_tank, disinfection_tank_percent.
- display.information : treatment_type, alarm_active, alarm_count, diagnostics.

Chaque liste conserve son ordre, déduplique ses choix et peut être vide. Effacer un choix multiple transmis comme null produit une liste vide, pas un retour aux valeurs par défaut. Un groupe absent utilise ses valeurs initiales : mesures eau/pH/ORP/pression, filtration, traitement annoncé/alarme globale/diagnostic ; consignes et cuves sont initialement vides.

Sélectionner seulement ph_tank_percent affiche le pourcentage pH et sa jauge, sans volume pH ni cuve désinfectant. Aucune dépendance entre ces choix. Les informations absentes restent explicites ; aucun autre contrôleur ou nom ressemblant n'est choisi automatiquement.

## Séparation affichage et fonctionnement

Changer la liste ne commande rien et ne modifie aucun mode firmware. Le traitement annoncé est affiché tel quel si choisi. Les commandes ne sont plus verrouillées par une interprétation de ce libellé : elles exigent la sélection de l'équipement et un état on/off disponible, puis sont validées par HA et Flow.io. Les démarrages sensibles demandent confirmation. Masquer une alarme ou un équipement ne désactive pas sa surveillance ou ses automatismes dans le contrôleur.

Les litres et pourcentages utilisent les slots configurés dans tank_slots, sans calcul local de consommation ni de capacité. Vérifier les slots et la diffusion HA des quatre métriques si vous les sélectionnez.

## Rupture de configuration

Ne pas conserver les anciens blocs entities, features, treatment, show_tanks ou measurements au premier niveau de la synthèse. Le modèle les rejette explicitement ; aucune compatibilité n'est fournie. Le format des historiques reste distinct, avec entity_prefix et measurements au premier niveau.

Les tests sont réécrits pour l'indépendance du traitement, la sélection séparée de chaque valeur, les états absents et indisponibles, les confirmations et le préfixe. La réussite de la nouvelle CI et le rendu dans votre instance restent à vérifier.
