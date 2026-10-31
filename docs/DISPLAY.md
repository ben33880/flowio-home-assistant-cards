# Choix d'affichage explicites

La carte principale utilise entity_prefix et display. Aucun mode de traitement ne décide des blocs affichés. L'utilisateur sélectionne ses mesures, consignes, équipements, valeurs de cuve et informations.

Le titre d'entête vient du champ `title`, utilisé tel quel ; sa valeur par défaut est `Supervision & pilotage`.

## Options

- display.measurements : water_temperature, air_temperature, ph, orp, pressure.
- display.setpoints : ph_setpoint, orp_setpoint. La consigne de désinfection est ORP, pas une concentration en chlore.
- display.equipment : filtration, ph_pump, disinfection_pump, electrolyzer, heater, robot, lighting, filling.
- display.tanks : ph_tank, ph_tank_percent, disinfection_tank, disinfection_tank_percent.
- display.information : treatment_type, alarm_active, alarm_count, diagnostics, network, system.
- display.operations : actions sélectionnées parmi refill_ph, refill_disinfection, reset_filtration, reset_ph, reset_disinfection, reset_filling, reset_electrolyzer, reset_all, timed_override.
- display.calculated_values : v00 à v04, mesures calculées publiées par le firmware.
- display.device_metrics : consigne/valeur relue et métriques de pompe à chaleur disponibles. `device_slot` (0–15) choisit l’équipement.

Chaque liste conserve son ordre, déduplique ses choix et peut être vide. Effacer un choix multiple transmis comme null produit une liste vide, pas un retour aux valeurs par défaut. Un groupe absent utilise ses valeurs initiales : mesures eau/pH/ORP/pression, filtration, traitement annoncé/alarme globale/diagnostic ; consignes et cuves sont initialement vides.

Sélectionner seulement ph_tank_percent affiche le pourcentage pH et sa jauge, sans volume pH ni cuve désinfectant. Aucune dépendance entre ces choix. Les informations absentes restent explicites ; aucun autre contrôleur ou nom ressemblant n'est choisi automatiquement.

## Séparation affichage et fonctionnement

Changer la liste ne commande rien et ne modifie aucun mode firmware. Le traitement annoncé est affiché tel quel si choisi. Les commandes ne sont plus verrouillées par une interprétation de ce libellé : elles exigent la sélection de l'équipement et un état on/off disponible, puis sont validées par HA et Flow.io. Les démarrages sensibles demandent confirmation. Masquer une alarme ou un équipement ne désactive pas sa surveillance ou ses automatismes dans le contrôleur.

Les litres et pourcentages utilisent les slots configurés dans tank_slots, sans calcul local de consommation ni de capacité. Vérifier les slots et la diffusion HA des quatre métriques si vous les sélectionnez.

## Entités firmware complémentaires

Les actions utilisent les boutons MQTT Discovery documentés par Flow.io : `button.<préfixe>_pd_refill_ph`, `pd_refill_chl`, `pd_reset_upt_flt`, `pd_reset_upt_ph`, `pd_reset_upt_chl`, `pd_reset_upt_fill`, `pd_reset_upt_chl_gen` et `pd_reset_upt_all`. Elles sont désactivées si l’entité manque ou est indisponible et demandent confirmation avant `button.press`.

Le forçage temporaire emploie les entités communes `select.<préfixe>_pdm_ovr_target`, `number.<préfixe>_pdm_ovr_min`, `sensor.<préfixe>_pdm_ovr_state` et `button.<préfixe>_pdm_ovr_{on,off,release}`. Le sélecteur reprend uniquement les choix publiés par le firmware. Sa sélection est globale et partagée entre utilisateurs ; une action acceptée n’atteste pas de la marche physique. Les protections et règles de durée restent dans Flow.io.

Les mesures calculées utilisent `sensor.<préfixe>_io_value_v00` à `v04`; leurs noms et unités suivent Home Assistant. La carte historique accepte `calculated_values: [v00, v01]` et lit les données du Recorder.

Les métriques équipement utilisent `sensor.<préfixe>_data_<176 + 32 × device_slot + metric_id>`, conformément au catalogue firmware. Les mesures disponibles comprennent `water_in`, `water_out`, `compressor_in`, `compressor_out`, `ambient`, `coil`, `voltage`, `current` et d’autres métriques numériques. Le slot est physique, pas le rôle de la piscine : vérifier la liaison dans le firmware.

`network` et `system` ajoutent les entités Discovery IP/MAC/RSSI, uptime, mémoire libre/minimale et fragmentation. Les listes choisies sont ajoutées au diagnostic des entités, sans remplacer les valeurs absentes par zéro.

## Rupture de configuration

Ne pas conserver les anciens blocs entities, features, treatment, show_tanks ou measurements au premier niveau de la synthèse. Le modèle les rejette explicitement ; aucune compatibilité n'est fournie. Le format des historiques reste distinct, avec entity_prefix et measurements au premier niveau.

Les tests sont réécrits pour l'indépendance du traitement, la sélection séparée de chaque valeur, les états absents et indisponibles, les confirmations et le préfixe. La réussite de la nouvelle CI et le rendu dans votre instance restent à vérifier.
