---
description: "Use when changing card layout, styles, rendering, or Playwright visual snapshots. Covers diagnosing README screenshot failures and safely updating baselines."
name: "Visual Snapshot Regression Checks"
applyTo:
  - "src/**/*.ts"
  - "e2e/**/*.ts"
---

# Visual snapshot regressions

- When a card layout or style changes, run the focused Playwright test in `e2e/readme-snapshots.spec.ts` for every affected light and dark card snapshot.
- If a README snapshot fails, inspect the failure output first. Distinguish a visual mismatch or changed image dimensions from a functional test failure; do not update snapshots to hide a functional failure.
- Before updating a snapshot, verify that the rendered difference is the intended result of the code change. Keep unrelated card snapshots unchanged.
- For an intentional visual change, regenerate only the affected snapshots with Playwright's `--update-snapshots` option, then rerun the same tests without that option to confirm the new baselines pass.
- When a UI change alters documented screenshots, ensure the matching images in `docs/` are the same updated baselines used by the README snapshot tests.
