# Project Guidelines

## Whitespace checks

Before finishing code changes, run `git diff --check` on hand-edited files. Exclude the generated `dist/flowio-home-assistant-cards.js` bundle from this check; its embedded license comments can contain trailing whitespace. Do not manually reformat the generated bundle just to silence that check.
