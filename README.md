# Flow.io Home Assistant Cards

Cartes de piscine configurées uniquement par préfixe et noms métier. Les utilisateurs conservent les identifiants proposés par le firmware. Cette refonte supprime les associations manuelles : les configurations contenant entities sont rejetées, sans migration ni compatibilité. Remplacer leur YAML par les nouveaux exemples.

## Pilotage

```yaml
type: custom:flowio-pool-card
title: Piscine
entity_prefix: fio
treatment: auto
features:
  filtration: true
  ph_control: true
  lighting: true
```

Le préfixe vaut fio par défaut. piscine produit sensor.piscine_io_ph et switch.piscine_io_flt_pmp. Un préfixe vide produit sensor.io_ph. Il correspond au préfixe HA du firmware, pas au topic MQTT. Les espaces de bord et underscores finaux sont retirés, les lettres sont mises en minuscules. Les autres caractères hors lettres/chiffres/underscores sont refusés.

Les suffixes et domaines sont centralisés dans src/entities.ts. Aucun rapprochement approximatif ni remplacement par une entité suffixée _2 n'est fait. Une section repliable indique les identifiants attendus et distingue absence, indisponibilité et présence. Présente signifie que l'entité existe et n'est pas unknown/unavailable, pas que la mesure est saine.

Traitement affiché : auto, chlorine, electrolysis, oxygen ou none. En auto, le sélecteur firmware pl_modes_dis est lu avec le même préfixe. En manuel, le contrôleur n'est pas modifié. Un désaccord connu bloque les démarrages de désinfection, mais une demande d'arrêt reste accessible pour un équipement affiché dont l'état est connu. Les sécurités restent dans Flow.io.

Mesures configurables : water_temperature, air_temperature, ph, orp, pressure. ORP est masqué sur la synthèse en mode O2 ou sans désinfection. Les commandes affichées suivent les équipements activés dans features. Les consignes ouvrent le dialogue natif ; aucun seuil de qualité d'eau n'est inventé.

## Cuves

show_tanks active les volumes estimés. tank_slots.ph vaut 1 et tank_slots.disinfection vaut 2 par défaut ; les deux acceptent 0 à 15 et doivent correspondre à votre configuration effective. Le volume est sensor.<prefix>_data_<112 + 2 * slot>. Les capteurs de cuve doivent être activés dans la diffusion HA du firmware. Le préfixe seul ne permet pas de déduire un changement d'affectation de slot.

## Historiques

```yaml
type: custom:flowio-history-card
entity_prefix: fio
hours_to_show: 24
measurements: [water_temperature, ph, orp, pressure]
```

Les courbes natives utilisent les mesures métier sélectionnées, une échelle par mesure, sur 1 à 168 heures. Les choix sont indépendants de la synthèse et peuvent donc inclure ORP même si elle y est masquée. Le Recorder reste responsable des données conservées ; aucune donnée ni courbe de secours n'est fabriquée.

## Développement et distribution

Node.js 24, ubuntu-24.04 et actions natives Node 24 sont conservés.

```sh
nvm install
nvm use
npm install
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run demo
```

La démo http://127.0.0.1:4173/demo/ permet de changer de préfixe, traitement et thème sur des états fictifs. Aucune commande réelle. Les tests ont été réécrits pour ce seul modèle ; ils doivent repasser la CI. Les tests de graphiques et d'éditeur simulent les composants internes HA et ne remplacent pas l'essai dans votre instance. Les palettes fixes appartiennent uniquement à la démo ; les cartes héritent du thème actif.

La CI publie le bundle validé dans dist sur main. Les releases existantes restent inchangées et peuvent contenir l'ancien format : pour cette refonte, installer le bundle main actualisé ou publier une nouvelle bêta. Voir docs/HACS.md et docs/HACS-TROUBLESHOOTING.md. Le lockfile npm reste à générer et versionner. Le firmware n'est pas modifié.
