# Jauges, horaires et identité visuelle

Les deux cartes héritent du thème HA : surfaces, textes, pictogrammes, accents par catégorie, en-têtes teintés et encadrements modernes. Aucune dépendance HACS supplémentaire ni CDN. Les éléments restent sélectionnés explicitement dans display ; le traitement annoncé ne masque rien et ne change aucune commande.

Les jauges SVG/Lit proposent arc, indicateur d'aiguille et anneau. Les % de cuves sélectionnés utilisent des anneaux 0–100 depuis les capteurs firmware. Une donnée absente ou non numérique ne devient pas zéro. Une mesure hors échelle reste affichée avec ce statut ; seul le tracé est borné.

visuals est facultatif et se règle dans l'éditeur : type tile, arc ou needle, min et max. Préréglages de présentation : pH 0–14, ORP 0–1000, pression 0–3, eau 0–40 et air -10–50. Ce ne sont ni des seuils de qualité, ni des limites matérielles, ni des recommandations de traitement. Adapter les échelles aux unités réellement publiées ; aucune conversion d'unité n'est effectuée. Une consigne pH/ORP est marquée uniquement si elle est sélectionnée, numérique et disponible. Hors échelle, sa valeur est indiquée mais son repère n'est pas dessiné.

Les couleurs distinguent les catégories sans inventer de conformité chimique. Les transitions sont courtes et désactivées selon prefers-reduced-motion, y compris dans les jauges. Pas d'animation permanente prétendant confirmer la rotation physique d'une pompe. Les historiques restent natifs HA et affichent une valeur Actuel distincte de la période.

Un thème peut définir flowio-water-color, flowio-air-color, flowio-ph-color, flowio-orp-color et flowio-pressure-color. Les autres couleurs viennent des variables de palette HA puis primary/accent.

Voir docs/TIMING.md pour les horaires calculés et compteurs. Les tests couvrent géométrie, échelles, valeurs absentes, compteurs, sélections et actions simulées. Quatre captures clair/sombre mobile/ordinateur sont jointes au rapport CI ; leurs courbes sont explicitement simulées, pas des historiques HA réels. Aucun succès de ce lot n'est présumé avant sa CI et l'essai dans votre instance. Après réussite de check et publish-dist, installer main actualisé ou publier une nouvelle beta. Les releases et le firmware existants ne sont pas modifiés.
