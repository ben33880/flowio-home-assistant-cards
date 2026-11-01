# Choix d'affichage explicites

La carte principale utilise entity_prefix et display. L'utilisateur sélectionne ses mesures, consignes, équipements, valeurs de cuve et informations ; le mode firmware actif détermine les modes et commandes adaptés au traitement.

Le titre d'entête vient du champ `title`, utilisé tel quel ; sa valeur par défaut est `Supervision`. Par défaut, toutes les options de chaque groupe sont cochées dans les paramètres, y compris les actions. Retirer les choix qui ne sont pas utiles à l'installation. La carte d'historiques sélectionne également toutes les mesures et valeurs calculées par défaut.

## Options

- display.measurements : water_temperature, air_temperature, ph, orp, pressure.
- display.setpoints : ph_setpoint, orp_setpoint. La consigne de désinfection est ORP, pas une concentration en chlore.
- display.equipment : filtration, ph_pump, disinfection_pump, heater, robot, lighting, filling. Le switch autonome « Électrolyseur » n’est plus affiché ; la commande de la pompe désinfectant cible l’électrolyseur en mode firmware « Electrolyse » et la pompe désinfectant en mode « Chlore/Brome » ou « Oxygène actif ».
- display.tanks : ph_tank, ph_tank_percent, disinfection_tank, disinfection_tank_percent.
- display.information : treatment_type, alarm_active, alarm_count, diagnostics, network, system.
- display.operations : actions sélectionnées parmi refill_ph, refill_disinfection, reset_filtration, reset_ph, reset_disinfection, reset_filling, reset_electrolyzer, reset_all, timed_override. Les actions de remise à zéro restent à côté de leur durée correspondante. Le panneau général « Actions Flow.io » n’est plus affiché ; le forçage temporaire conserve son bouton et son dialogue natif.
- En mode firmware « Electrolyse », la jauge ORP reste affichée mais l’estimation « Désinfection injectée aujourd’hui » est masquée ; l’estimation pH reste indépendante.
- display.calculated_values : v00 à v04, mesures calculées publiées par le firmware.
- display.device_metrics : consigne/valeur relue et métriques de pompe à chaleur disponibles. `device_slot` (0–15) choisit l’équipement.
- Le type de traitement est déduit de `select.<préfixe>_pl_modes_dis` : « Désactivé », « Electrolyse », « Chlore/Brome » ou « Oxygène actif ». Il n’existe plus de sélection manuelle redondante dans `display`. Les anciennes configurations comportant `display.treatment` restent acceptées, mais cette valeur est ignorée. Si l’entité manque ou a un état inconnu, la carte n’envoie pas d’action désinfection et maintient indisponibles les commandes dont la cible dépend du traitement.

Chaque liste conserve son ordre, déduplique ses choix et peut être vide. Effacer un choix multiple transmis comme null produit une liste vide, pas un retour aux valeurs par défaut. Un groupe omis utilise toutes les options disponibles de ce groupe ; un groupe explicitement vidé reste vide.

Sélectionner seulement ph_tank_percent affiche le pourcentage pH et sa jauge, sans volume pH ni cuve désinfectant. Aucune dépendance entre ces choix. Les informations absentes restent explicites ; aucun autre contrôleur ou nom ressemblant n'est choisi automatiquement.

## Séparation affichage et fonctionnement

Changer les listes ne modifie aucun mode firmware. L’entité du sélecteur détermine si le switch « Pompe désinfectant » commande `switch.<préfixe>_io_chl_gen` (Électrolyseur) ou `switch.<préfixe>_io_chl_pmp` (pompe désinfectant). Le switch exige la sélection de l’équipement et un état on/off disponible, puis la commande est validée par HA et Flow.io. Les démarrages sensibles demandent confirmation. Masquer un équipement ne désactive pas sa surveillance ou ses automatismes dans le contrôleur.

Les litres et pourcentages utilisent les slots configurés dans tank_slots, sans calcul local de consommation ni de capacité. Vérifier les slots et la diffusion HA des quatre métriques si vous les sélectionnez.

## Entités firmware complémentaires

Les actions utilisent les boutons MQTT Discovery documentés par Flow.io : `button.<préfixe>_pd_refill_ph`, `pd_refill_chl`, `pd_reset_upt_flt`, `pd_reset_upt_ph`, `pd_reset_upt_chl`, `pd_reset_upt_fill`, `pd_reset_upt_chl_gen` et `pd_reset_upt_all`. Les icônes de remplissage pH et désinfectant apparaissent à côté de leurs jauges respectives ; le remplissage désinfectant est réservé aux modes « Chlore/Brome » et « Oxygène actif ». La remise à zéro présentée sous la durée « Désinfection » appelle `pd_reset_upt_chl` pour ces modes et `pd_reset_upt_chl_gen` en mode « Electrolyse ». Les options restent configurées lorsque le mode firmware change, mais seules les actions compatibles avec le mode actif sont disponibles. Les remises à zéro de filtration, pH et désinfection apparaissent en icône avec infobulle sous leur durée dans « Horaires & durées » ; leur sélection affiche aussi la durée associée. Ces actions sont désactivées si l’entité correspondante manque ou est indisponible et demandent confirmation avant `button.press`.

Le forçage temporaire s’ouvre depuis un bouton natif Home Assistant dans une boîte de dialogue HA. Le formulaire HA utilise les entités communes `select.<préfixe>_pdm_ovr_target`, `number.<préfixe>_pdm_ovr_min`, `sensor.<préfixe>_pdm_ovr_state` et `button.<préfixe>_pdm_ovr_{on,off,release}`. Le sélecteur reprend uniquement les choix publiés par le firmware. La commande exige une confirmation dans la boîte de dialogue ; une action acceptée n’atteste pas de la marche physique. La sélection est globale et partagée entre utilisateurs. Les protections et règles de durée restent dans Flow.io.

Les mesures calculées utilisent `sensor.<préfixe>_io_value_v00` à `v04`; leurs noms et unités suivent Home Assistant. La carte historique accepte `calculated_values: [v00, v01]` et lit les données du Recorder.

Les métriques équipement utilisent `sensor.<préfixe>_data_<176 + 32 × device_slot + metric_id>`, conformément au catalogue firmware. Les mesures disponibles comprennent `water_in`, `water_out`, `compressor_in`, `compressor_out`, `ambient`, `coil`, `voltage`, `current` et d’autres métriques numériques. Le slot est physique, pas le rôle de la piscine : vérifier la liaison dans le firmware.

`network` et `system` affichent les informations réseau (adresse IP et MAC) et système (uptime, mémoire libre/minimale et fragmentation) dans une fenêtre dédiée. « Signal Wi-Fi » apparaît uniquement si l’entité fournit une valeur disponible ; il n’est pas supposé exister, notamment en connexion Ethernet. Les lignes reprennent les icônes `icon` fournies par les entités du firmware dans Home Assistant. Le groupe `system` comprend aussi la tension (V) et le courant du slot défini par `device_slot`, même si ces métriques ne sont pas cochées dans `display.device_metrics`. Un petit bouton natif accessible au toucher apparaît près du titre « Supervision » si au moins un de ces groupes est sélectionné. Les listes choisies restent ajoutées au diagnostic des entités ; les valeurs absentes sont explicites, jamais remplacées par zéro.

## Rupture de configuration

Ne pas conserver les anciens blocs entities, features, treatment, show_tanks ou measurements au premier niveau de la synthèse. Le modèle les rejette explicitement ; aucune compatibilité n'est fournie. Le format des historiques reste distinct, avec entity_prefix et measurements au premier niveau.

Les tests sont réécrits pour l'indépendance du traitement, la sélection séparée de chaque valeur, les états absents et indisponibles, les confirmations et le préfixe. La réussite de la nouvelle CI et le rendu dans votre instance restent à vérifier.
