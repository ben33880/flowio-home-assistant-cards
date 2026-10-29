# Préversions et installation HACS

## État

Ce guide et le workflow préparent la distribution. Leur ajout au dépôt ne crée ni tag, ni release, ni installation HACS. La CI précédente a été signalée réussie par l'utilisateur ; le workflow de publication devra lui-même être exécuté et vérifié.

## Publier une préversion

Dans GitHub, ouvrir Actions, choisir Publish HACS prerelease (manual), puis Run workflow sur main. Indiquer une nouvelle version beta, par exemple 0.1.0-beta.1, sans v.

Attention : lancer ce workflow autorise une modification publique du dépôt. Après réussite des vérifications, il crée le tag v0.1.0-beta.1 et une release publique marquée prerelease, avec les trois fichiers du build. Le workflow refuse de réutiliser un tag existant. Il ne se lance pas sur push et ne publie aucune version stable.

La compilation et les tests se font avec Node.js 24, ubuntu-24.04 et des actions utilisant nativement Node.js 24. Le job de validation possède uniquement contents: read ; seul le job final de publication dispose de contents: write. Le bundle est reconstruit en mode production après les tests navigateur, afin de ne pas distribuer la sortie de développement du serveur d'aperçu.

Les tests ne se connectent pas à la piscine. Ils valident la configuration et le comportement simulé, pas une instance Home Assistant complète. Aucun essai matériel n'est présumé.

## Fichiers distribués

- flowio-home-assistant-cards.js : bundle des cartes, avec Lit inclus.
- release-metadata.json : version de distribution et SHA du commit compilé.
- SHA256SUMS : empreintes du JavaScript et des métadonnées.

Le tag vise le commit de démarrage du workflow, pas un état plus récent de main. Les métadonnées et les empreintes sont vérifiées après transfert vers le job de publication. Les empreintes détectent une altération des fichiers, mais ne sont pas une signature indépendante. Le package.json source reste en version de développement ; la version de distribution est portée par le tag et les métadonnées.

Le lockfile npm reste à générer et versionner. Ce workflow utilise npm install, pas npm ci : la résolution des dépendances n'est pas encore figée.

En cas d'échec pendant l'envoi des fichiers, GitHub peut conserver un brouillon de release partiel. Vérifier l'état avant de relancer ; le workflow n'efface ni ne remplace automatiquement un tag ou une release.

## Installation par HACS

Après publication réussie, ajouter https://github.com/ben33880/flowio-home-assistant-cards aux dépôts personnalisés HACS, catégorie Dashboard. Ce dépôt n'est pas soumis automatiquement au catalogue par défaut.

Le nom du JavaScript correspond au dépôt et à hacs.json. HACS peut récupérer le bundle joint à une release. Puisqu'il s'agit d'une préversion, activer ou sélectionner les versions beta dans l'interface de téléchargement si votre version HACS le propose. Vérifier que la version choisie est effectivement la beta publiée ; ne pas supposer qu'elle remplace automatiquement la dernière version stable. Si la préversion n'est pas proposée, l'installation manuelle reste disponible.

Après installation, vérifier les ressources du dashboard : le module attendu est /hacsfiles/flowio-home-assistant-cards/flowio-home-assistant-cards.js. Éviter de charger simultanément une ancienne copie manuelle et la copie HACS. Recharger le frontend si nécessaire. La compatibilité de ce chemin et de la sélection beta doit être confirmée lors du premier essai HACS.

Les cartes disponibles sont custom:flowio-pool-card et custom:flowio-history-card. L'exemple examples/dashboard-chlorine.yaml réunit les deux dans une vue Sections. Vérifier chaque identifiant d'entité dans votre instance avant d'utiliser les commandes.

## Installation manuelle

Télécharger le JavaScript depuis la release vérifiée, le copier dans config/www/flowio/flowio-home-assistant-cards.js, puis déclarer /local/flowio/flowio-home-assistant-cards.js comme ressource JavaScript module. Supprimer les ressources en double.

Les clics sur les commandes dans une vraie instance Home Assistant peuvent actionner les équipements. Les sécurités restent dans Flow.io ; l'installation de ces cartes ne configure pas le broker, les capteurs ou le traitement.
