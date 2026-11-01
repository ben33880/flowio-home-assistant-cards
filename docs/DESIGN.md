# Jauges, horaires et identité visuelle

Les deux cartes héritent du thème HA : surfaces, textes, pictogrammes, accents par catégorie, en-têtes teintés et encadrements modernes. Aucune dépendance HACS supplémentaire ni CDN. Les éléments restent sélectionnés explicitement dans display ; le traitement annoncé ne masque rien et ne change aucune commande.

Les jauges SVG/Lit proposent arc, indicateur d'aiguille et anneau. Les % de cuves sélectionnés utilisent des anneaux 0–100 depuis les capteurs firmware. Une donnée absente ou non numérique ne devient pas zéro. Une mesure hors échelle reste affichée avec ce statut ; seul le tracé est borné.

visuals est facultatif et se règle dans l'éditeur : type tile, arc ou needle, min et max. Préréglages de présentation : pH 0–14, ORP 0–1000, pression 0–3, eau 0–40 et air -10–50. Ce ne sont ni des seuils de qualité, ni des limites matérielles, ni des recommandations de traitement. Adapter les échelles aux unités réellement publiées ; aucune conversion d'unité n'est effectuée. Une consigne pH/ORP est marquée uniquement si elle est sélectionnée, numérique et disponible. Hors échelle, sa valeur est indiquée mais son repère n'est pas dessiné.

Les équipements et modes utilisent le composant natif `ha-switch` de Home Assistant. Les boutons d’action et d’icône utilisent `ha-button`, les pictogrammes `ha-icon`, et le titre s’appuie sur la carte native de titre HA. Les styles du projet adaptent ces composants aux plaques d’icônes et aux couleurs Flow.io existantes, tout en héritant des variables de thème HA ; ils ne recréent pas leurs contrôles dans le bundle de production. Les libellés « Démarrer » et « Arrêter » restent disponibles pour l’accessibilité. La confirmation et les commandes switch.turn_on/turn_off restent inchangées.

Quand le diagnostic réseau ou système est sélectionné, une icône native sans libellé visible ouvre le dialogue correspondant. Elle est accolée au titre « Supervision & pilotage », avant les badges du titre ; son infobulle et son nom accessible décrivent l’action. Le fond, la forme et l’accent de sa plaque reprennent le style des icônes de la carte avec des couleurs issues du thème Home Assistant. Les valeurs du dialogue emploient les icônes `icon` publiées par les entités firmware lorsqu’elles sont disponibles.

Les actions sélectionnées de remplissage pH/désinfectant sont des icônes à infobulle placées à côté des jauges de cuve correspondantes. Les actions de remise à zéro filtration/pH/désinfection sont placées sous leur durée respective dans « Horaires & durées », en bas à droite. Elles conservent leurs confirmations firmware ; leurs icônes ne remplacent pas les états et valeurs affichés.

Les couleurs distinguent les catégories sans inventer de conformité chimique. Les transitions sont courtes et désactivées selon prefers-reduced-motion, y compris dans les jauges. Pas d'animation permanente prétendant confirmer la rotation physique d'une pompe. Les historiques restent natifs HA et affichent une valeur Actuel distincte de la période.

Un thème peut définir flowio-water-color, flowio-air-color, flowio-ph-color, flowio-orp-color et flowio-pressure-color. Les autres couleurs viennent des variables de palette HA puis primary/accent.

Voir docs/TIMING.md pour les horaires calculés et compteurs. Les tests couvrent géométrie, échelles, valeurs absentes, compteurs, sélections et actions simulées. Quatre captures clair/sombre mobile/ordinateur sont jointes au rapport CI ; leurs courbes sont explicitement simulées, pas des historiques HA réels. Aucun succès de ce lot n'est présumé avant sa CI et l'essai dans votre instance. Après réussite de check et publish-dist, installer main actualisé ou publier une nouvelle beta. Les releases et le firmware existants ne sont pas modifiés.
