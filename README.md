# Flow.io Home Assistant Cards

Cartes de piscine par préfixe firmware et sélection explicite des éléments. Aucun bloc de la synthèse ne dépend de la détection du traitement. Les identifiants firmware restent inchangés et sont centralisés dans src/entities.ts.

## Synthèse

```yaml
type: custom:flowio-pool-card
entity_prefix: fio
display:
  measurements: [water_temperature, ph, orp, pressure]
  setpoints: [ph_setpoint, orp_setpoint]
  equipment: [filtration, ph_pump, disinfection_pump, lighting]
  tanks: [ph_tank, ph_tank_percent, disinfection_tank, disinfection_tank_percent]
  information: [treatment_type, alarm_active, alarm_count, diagnostics]
tank_slots:
  ph: 1
  disinfection: 2
```

L'éditeur présente des listes à choix multiples pour chaque groupe. Une liste vide masque ce groupe ; chaque volume et pourcentage peut être choisi indépendamment. Les entités sélectionnées mais absentes ou indisponibles restent visibles avec leur statut. Le diagnostic est lui aussi optionnel.

Les champs précédents entities, features, treatment, show_tanks et measurements au premier niveau de la synthèse sont rejetés, sans migration. Remplacer les configurations par les nouveaux exemples. Pour les historiques, measurements reste au premier niveau.

Le préfixe vaut fio ; piscine construit sensor.piscine_io_ph. Un préfixe vide supprime le segment de préfixe. Les caractères sont validés, les lettres mises en minuscules et les underscores finaux retirés. Aucun remplacement automatique par une entité suffixée _2.

## Commandes et traitement

Le traitement annoncé est une information facultative, affichée brute depuis select.<prefix>_pl_modes_dis. Il n'est ni interprété pour masquer des éléments, ni utilisé comme verrou implicite de commande. Le choix d'affichage ne modifie jamais ce sélecteur.

Une commande exige que l'équipement soit sélectionné et que son entité soit disponible avec un état on/off. Les démarrages de filtration, dosage et remplissage demandent confirmation. Les actions passent par les switches HA ; le firmware reste responsable des interlocks et de l'arbitrage manuel/automatique. Les erreurs de commande restent visibles même si les informations sont masquées. Afficher un équipement ne garantit pas que sa mise en marche sera autorisée. Une sortie active ne confirme pas physiquement la marche.

## Cuves

Les volumes et % sont des estimations firmware distinctes. Pour pdN : volume data_(112+2*N), pourcentage data_(113+2*N). Les slots par défaut sont pH=1, désinfectant=2, à vérifier dans votre installation. Activer les valeurs voulues dans la diffusion HA du firmware. La jauge n'existe que si le % est choisi et numérique entre 0 et 100. Une absence n'est jamais convertie en zéro ; zéro réel reste valide. Aucun calcul depuis une capacité supposée.

## Historiques

```yaml
type: custom:flowio-history-card
entity_prefix: fio
hours_to_show: 24
measurements: [water_temperature, ph, orp, pressure]
```

Les historiques natifs sont indépendants de la synthèse et utilisent le Recorder, sans stockage supplémentaire.

## Développement et distribution

Node.js 24, ubuntu-24.04 et les actions natives Node 24 sont conservés.

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

La démo locale utilise seulement des données fictives, avec préfixe, état firmware simulé et thème modifiables. Aucun équipement réel n'est commandé. Les palettes fixes appartiennent à la démo ; les cartes héritent du thème HA. Les tests des graphiques et de l'éditeur simulent leurs dépendances internes et ne remplacent pas l'essai HA réel. Le nouveau lot doit repasser la CI ; aucun succès n'est présumé. Le lockfile reste à générer et versionner.

Après réussite de check et publish-dist, le bundle est publié dans dist sur main. Les anciennes releases restent inchangées : installer main actualisé ou publier une nouvelle beta. Voir docs/HACS.md et docs/DISPLAY.md. Le firmware n'est pas modifié.
