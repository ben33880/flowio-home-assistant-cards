# HACS : Repository structure for main is not compliant

## Cause constatée

Au diagnostic, la branche main ne contenait ni bundle à la racine ni dossier dist versionné. La préversion v0.1.0-beta.1 était publiée, mais HACS signalait la validation de main. Les sources TypeScript et les artefacts GitHub Actions seuls ne constituent pas une distribution frontend récupérable depuis cette branche.

## Correction

Le workflow Check and build compile et teste le projet, puis reconstruit le JavaScript de production après les tests navigateur. Sur main, après un push ou un déclenchement manuel, le job publish-dist récupère ce bundle et crée un commit limité à dist/flowio-home-assistant-cards.js. Le dossier est créé par le téléchargement de l'artefact.

Le chemin dist est encore ignoré pour les fichiers de travail locaux ; git add -f ajoute explicitement ce seul fichier distribué. Une fois versionné, il est disponible sur main et peut être mis à jour par la CI. Aucun fichier vide ou chargeur fictif n'est ajouté. Le manifeste hacs.json conserve filename: flowio-home-assistant-cards.js.

Le job de publication dispose de contents: write, contrairement au job de test qui reste en lecture seule. Il n'exécute pas npm ni les tests. Aucun push n'est effectué depuis une pull request. Le job refuse de publier si main a avancé depuis le commit compilé ; aucun force-push n'est utilisé. Le commit généré porte [skip ci] et ne publie aucune release.

## Vérification après application

1. Attendre la réussite de check ET de publish-dist dans GitHub Actions. Une réussite de compilation seule ne suffit pas.
2. Vérifier qu'un commit github-actions[bot] a ajouté le fichier dist/flowio-home-assistant-cards.js sur main et que ce fichier n'est pas vide.
3. Recharger les informations du dépôt dans HACS ou réessayer son ajout comme dépôt personnalisé Dashboard. Une version beta peut nécessiter une sélection explicite ; main ne dépend désormais plus de sa détection pour disposer du JavaScript.
4. Éviter de charger simultanément une ancienne copie manuelle et la ressource HACS.

L'ajout du workflow ne signifie pas que le bundle est déjà publié : la CI doit terminer son exécution et son push. La compatibilité finale doit être vérifiée dans votre instance HACS.

## Si publish-dist échoue

Une protection de branche ou une politique GitHub peut refuser le push du GITHUB_TOKEN malgré contents: write. Ne pas désactiver les protections sans examen. Utiliser alors une publication par pull request ou une release installable, selon les règles du dépôt. Le workflow n'essaie pas de contourner une protection.

Si main a avancé, attendre la CI du dernier commit ou relancer Check and build sur main. Si le bundle est identique, aucun commit supplémentaire n'est créé.

Le guide docs/HACS.md décrit le workflow de préversion séparé. Celui-ci reste manuel. Cette correction ne change ni la visibilité du dépôt, ni les tags existants, ni le firmware Flow.io.
