# Préparer la première release 0.1.0

Cette procédure prépare un brouillon. Elle ne publie pas automatiquement une version stable et n'envoie aucune commande à la piscine.

## 1. Vérifier les dépendances figées

Le dépôt versionne `package-lock.json`. Les workflows CI et release utilisent `npm ci` pour installer exactement les dépendances verrouillées. Ne pas régénérer le lockfile pour une release sans changement de dépendances.

Si les manifestes de dépendances changent, ouvrir Actions > Prepare dependency lock (manual) sur le dernier `main`. Le workflow régénère le lockfile, puis exécute `npm ci`, les tests unitaires, le build TypeScript/production et les tests Chromium. Revoir et fusionner la PR générée avant de préparer la release. Si `main` avance pendant l'exécution, relancer le workflow depuis son dernier commit.

## 2. Vérifier dans Home Assistant

Contrôler le rendu, les ressources sans doublon, les bons préfixes/entités, les switches natifs et l'annulation des confirmations sur la version HA utilisée. Contrôler les modes visibles, les historiques disponibles et les états indisponibles.

Ne pas activer des pompes ou changer un produit pour tester une interface sans procédure de sécurité adaptée. Un smoke test d'interface n'est pas une certification matérielle ou chimique. Un test de téléchargement HACS après publication reste nécessaire.

## 3. Préparer le brouillon

1. Vérifier package.json = 0.1.0, le lockfile fusionné et les notes docs/releases/v0.1.0.md.
2. Actions > Prepare stable release draft (manual), sur main.
3. Version : 0.1.0. Cocher ha_smoke_tested uniquement si ce contrôle a réellement été effectué.
4. Le workflow teste le commit exact de démarrage, utilise npm ci et reconstruit le bundle de production après les tests navigateur.
5. Il génère la provenance et les mentions des dépendances réellement incluses, puis vérifie les empreintes après transfert entre jobs.
6. Il crée uniquement un brouillon v0.1.0. Un tag ou une release existants ne sont jamais remplacés. Inspecter un brouillon partiel avant toute relance.

## 4. Publication distincte

Relire les notes, vérifier le SHA source et les fichiers du brouillon, puis publier manuellement depuis Releases. Pour une stable validée, ne pas cocher prerelease et choisir explicitement la politique Latest souhaitée. Ne pas réutiliser un tag pour corriger un fichier : préparer une nouvelle version.

Après publication, vérifier le téléchargement via HACS et l'absence d'ancienne ressource JS dans le navigateur. Les installations réelles restent responsables de leurs protections et réglages.

## Artefacts

- flowio-home-assistant-cards.js : bundle autonome des cartes avec mentions de licence.
- release-metadata.json : version, source exacte, versions des paquets, empreintes et validation déclarée.
- THIRD_PARTY_NOTICES.txt et LICENSE : licences distribuées.
- package-lock.json : dépendances figées utilisées par le build.
- RELEASE_NOTES.md et SHA256SUMS.

Les empreintes détectent une altération ; elles ne sont pas une signature indépendante. Les versions de dépendances sont figées par le lockfile ; aucune identité binaire entre environnements n'est promise.
