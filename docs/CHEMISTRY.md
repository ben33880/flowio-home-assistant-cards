# Bandes pH, ORP et pression sur les jauges

Les repères affichés suivent les valeurs indiquées par le propriétaire :

- pH bon : 7,0 à 7,4 inclus.
- pH moyen : 6,8 à moins de 7,0, et plus de 7,4 jusqu'à 7,6 inclus.
- pH mauvais : inférieur à 6,8 ou supérieur à 7,6.
- ORP dans la plage cible : 650 à 750 mV inclus.
- Pression OK : 3 à 16 psi inclus.

Les segments colorés et le statut sont portés par les jauges mêmes. La tuile séparée « Consignes » n'est plus rendue : le choix display.setpoints sert uniquement à montrer un repère sur la jauge pH/ORP. La consigne reste une valeur de régulation ; elle n'est pas confondue avec la plage cible.

Pour les cuves, l'anneau de pourcentage affiche aussi le volume restant du capteur volume associé, par exemple « 12 L restant ». Si le capteur volume est absent ou indisponible, la jauge affiche « Volume indisponible » ; elle ne remplace pas l'absence par 0 L. Le volume reste une estimation du firmware, sans conversion ni calcul supplémentaire.

Les zones sont informatives et n'envoient aucune commande, ne changent aucune consigne ni sécurité du firmware. Une donnée absente ou indisponible n'est pas évaluée. Une valeur hors échelle de présentation est signalée séparément des bandes métier.

Les tests couvrent les frontières pH (6,8 ; 7,0 ; 7,4 ; 7,6), ORP (650 et 750 mV), pression (3 et 16 psi), l'absence de la consigne affichée séparément et les mesures indisponibles. Ils doivent passer dans la CI avant d'installer le nouveau bundle. Aucun essai matériel ou chimique n'est effectué.
