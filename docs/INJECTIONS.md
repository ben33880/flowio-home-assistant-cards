# Volumes injectés estimés et températures compactes

Les deux indicateurs sont dans Mesures > Qualité de l’eau, sous les jauges. Ils sont indépendants des mesures physiques et désactivés par défaut pour ne pas réactiver un groupe sur les cartes existantes. Les cocher dans l’éditeur, groupe Volumes injectés, ou ajouter à display :

```yaml
injections: [ph_injected, disinfection_injected]
```

Formule pour chaque pompe : `mL = temps de marche du jour en secondes / 3600 × débit configuré en L/h × 1000`, arrondi au mL. Il s’agit d’une estimation, pas d’une mesure physique et jamais d’une commande de dosage.

Sources par défaut avec le préfixe fio :

| Pompe | Compteur du jour | Débit |
| --- | --- | --- |
| pH | sensor.fio_data_145 | number.fio_pd1_flow |
| Désinfectant | sensor.fio_data_146 | number.fio_pd2_flow |

Le catalogue actuel du firmware utilise data_(144 + slot) pour les temps de marche journaliers. Le nom pd_chl_pmp_upt donné dans l’exemple d’un ancien tableau n’est pas utilisé comme alias automatique.

runtime_slots.ph et runtime_slots.disinfection choisissent les compteurs physiques, par défaut 1 et 2. Les entités pd1_flow et pd2_flow sont des identités métier stables : PoolRoleHaDiscovery.h les relie aux affectations effectives des pompes au démarrage du firmware. Ne pas remplacer ces noms par le numéro du slot de compteur. Vérifier que les slots choisis correspondent à l’installation et que leurs compteurs sont publiés dans Home Assistant.

Une source manquante, non numérique, négative ou avec une unité incompatible affiche Indisponible, pas 0 mL. Un compteur réellement nul reste 0 mL. Le clic ouvre les informations du compteur, ou du débit si seul ce dernier existe.

Le calcul réapplique le débit courant à tout le compteur du jour. Changer le débit peut donc réestimer le volume affiché pour la journée ; ce n’est pas l’intégrale historique du débit et cela ne remplace pas les métriques internes du firmware. La calibration réelle de la pompe reste déterminante.

Les tuiles de température en présentation Tuile sont réduites à un gabarit d’environ 68 px de haut. Les présentations de température explicitement configurées en jauge gardent le gabarit des jauges et ne sont pas comprimées.

Sources firmware vérifiées : src/Core/Generated/DataValueCatalog_Generated.h, src/Core/Values/PoolDeviceValues.h et src/Profiles/Waveshare/PoolRoleHaDiscovery.h dans ben33880/Flow.io-Waveshare.
