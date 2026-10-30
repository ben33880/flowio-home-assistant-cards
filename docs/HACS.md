# Installation HACS et manuelle

## Avant publication

0.3.1 est préparée dans le dépôt, mais son brouillon n'a pas encore été créé et la version n'est pas publiée. Modifier package.json ou les notes ne constitue pas une release. Les versions antérieures et préversions restent inchangées.

Voir [la procédure de release](RELEASE.md) : lockfile testé et fusionné, contrôle de l'interface HA, puis workflow stable qui crée uniquement un brouillon. La publication publique est manuelle et distincte.

L'ancien workflow Publish HACS prerelease (manual) reste destiné aux beta : son lancement peut créer une préversion publique après tests. Ne pas le confondre avec la préparation d'une stable ; choisir une nouvelle version beta, jamais un tag déjà utilisé.

## Après publication : HACS

1. Ajouter https://github.com/ben33880/flowio-home-assistant-cards aux dépôts personnalisés HACS, catégorie Dashboard.
2. Télécharger explicitement la version publiée souhaitée. Le dépôt n'est pas ajouté automatiquement au catalogue HACS par défaut.
3. Vérifier la ressource `/hacsfiles/flowio-home-assistant-cards/flowio-home-assistant-cards.js`, type module JavaScript.
4. Supprimer les anciennes ressources manuelles ou en double, puis recharger le frontend.

Le nom du bundle correspond à hacs.json et à l'asset de release. Le téléchargement réel via HACS doit être contrôlé lors de la première installation. Une préversion peut nécessiter d'activer les versions beta dans HACS ; un brouillon n'est pas une release installable publique.

Cartes disponibles : `custom:flowio-pool-card` et `custom:flowio-history-card`. Les exemples et le README utilisent les entités métier du firmware par préfixe. Vérifier la présence des entités et les slots avant toute commande.

## Installation manuelle

Télécharger le JavaScript de la release vérifiée, le copier dans `config/www/flowio/flowio-home-assistant-cards.js` et déclarer `/local/flowio/flowio-home-assistant-cards.js` comme ressource module JavaScript. Ne pas charger aussi la copie HACS.

La release fournit SHA256SUMS pour contrôler les fichiers. Le bundle contient Lit et ApexCharts ; les licences des dépendances sont incluses dans le JavaScript et jointes séparément.

La carte ne configure pas MQTT, le Recorder ou le contrôleur. Les clics sur des commandes dans une vraie instance HA peuvent agir sur les équipements ; les sécurités restent dans Flow.io.
