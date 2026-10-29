# Première carte de développement

Le README initial décrit la cible. Ce commit ajoute une première carte et son éditeur ; il ne constitue pas encore une release HACS prête à installer.

## Compiler

Avec Node.js 22 :

```sh
npm install
npm test
npm run build
```

Le bundle inclut Lit et ne charge pas de bibliothèque depuis un CDN. Il est produit dans `dist/flowio-home-assistant-cards.js`. La CI effectue ces commandes et expose le bundle comme artefact ; son succès doit être vérifié dans GitHub Actions. Le lockfile reste à générer et à versionner pour rendre les installations reproductibles ; la CI utilise donc temporairement npm install, pas npm ci.

## Essai manuel dans Home Assistant

1. Copier le bundle compilé dans `config/www/flowio/flowio-home-assistant-cards.js`.
2. Ajouter `/local/flowio/flowio-home-assistant-cards.js?v=0.1.0-dev` comme ressource JavaScript module du dashboard.
3. Ajouter la carte Flow.io Piscine et ouvrir son éditeur visuel.
4. Associer les entités réelles ; le fichier examples/pool.yaml est un exemple, pas une détection de votre installation.

La carte n'utilise aucune connexion MQTT directe ni identifiant de broker. Les commandes passent par les actions Home Assistant des entités associées. La sélection du traitement affiché ne modifie jamais le sélecteur du contrôleur.

## Périmètre actuel

- Mesures et accès au dialogue more-info.
- Traitement auto ou manuel ; avertissement et blocage des commandes de désinfection en cas de désaccord connu.
- Équipements optionnels, commandes explicites, confirmation pour dosage et remplissage.
- État global des alarmes toujours visible, même si un équipement est masqué. L'état inconnu n'est pas présenté comme sain.
- Cuves estimées optionnelles ; unités reprises de l'entité associée.
- Styles héritant des variables du thème ; aucune dépendance à Mushroom ou card-mod.

## Limites et validations restantes

Les tests ajoutés couvrent le modèle de configuration, pas le rendu navigateur. Aucun essai Home Assistant, HACS ni matériel n'est présumé. Vérifier les modes clair/sombre, mobile, éditeur ha-form, droits limités, états indisponibles et commandes refusées.

Les graphiques, cartes spécialisées, liste détaillée d'alarmes, planification O2, forçages temporaires, consignes de vitesse et traductions supplémentaires ne sont pas encore implémentés. Les mesures et commandes ne constituent pas une confirmation physique du fonctionnement d'un appareil.

## Distribution HACS

Le manifeste est présent, mais le dépôt source seul n'est pas encore installable : aucun bundle dist n'est versionné ni publié dans une release par ce commit. Après validation de la CI et des essais HA, publier le bundle portant exactement le nom flowio-home-assistant-cards.js dans une release ou le rendre disponible dans dist selon les exigences HACS. Ne pas annoncer une installation HACS fonctionnelle avant ce contrôle.
