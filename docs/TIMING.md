# Horaires et durées

Ajouter à display.timing les éléments voulus : filtration_schedule, filtration_runtime, ph_runtime, disinfection_runtime. Une liste vide masque ce groupe ; elle est vide par défaut. Aucun compteur ne dépend de l'affichage d'une pompe.

filtration_schedule lit sensor.<prefix>_pl_flt_start et sensor.<prefix>_pl_flt_stop, en heures, pour afficher une plage calculée comme 08:00 → 20:00. C'est une fenêtre prévue par Flow.io, pas un journal des périodes réellement parcourues. Les durées comptabilisées sont séparées.

Les compteurs journaliers utilisent sensor.<prefix>_data_<144 + slot>. runtime_slots définit filtration=0, ph=1, disinfection=2 par défaut ; vérifier les affectations réelles. Ils sont indépendants des slots de cuves. Le pH et la désinfection représentent le temps de marche des équipements choisis, pas une plage continue ni le temps d'action du produit dans l'eau.

Les valeurs source sont en secondes. La carte les formate en h/min/s, conserve zéro réel et distingue absence, indisponibilité et valeur invalide. Une unité explicite autre que s est signalée, sans conversion supposée. Les sources sélectionnées sont incluses dans le diagnostic.

Les temps journaliers sont désactivés par défaut dans la diffusion HA du catalogue firmware. Activer les valeurs correspondant aux slots souhaités dans Diffusion des données, enregistrer puis redémarrer le contrôleur. Une donnée non annoncée n'est pas remplacée par zéro. Le frontend ne modifie pas cette configuration.

Les couleurs et valeurs illustratives des tests ne sont pas celles de votre piscine. Les composants sont en lecture seule : toucher une valeur ouvre son dialogue HA, sans commande de pompe ni remise à zéro. Les tests ajoutés doivent repasser la CI.
