# Vendored code

Source: https://github.com/heyhuynhgiabuu/pi-pretty
Commit: aa37095918c5b87837ac45f60799551e5401cac8 (package version 0.10.2)
Copied: 2026-11-25
License: MIT, upstream notice kept in `vendor/LICENSE`

| Upstream file | Here | Changes |
| --- | --- | --- |
| `src/prompt-editor.ts` | `vendor/prompt-editor.ts` | none |
| `src/working-indicator.ts` | `vendor/working-indicator.ts` | line 19: `./config.js` import now points to `./config-lite.js` |
| `src/session-color.ts` | `vendor/session-color.ts` | none |
| `src/user-rail.ts` | `vendor/user-rail.ts` | rail state stored on `globalThis`; install marker set on the prototype instead of the render function (see below) |
| `src/config.ts` lines 19, 24, 25, 71 to 93 | `vendor/config-lite.ts` | verbatim subset: `FG_DIM`, `FG_BLUE`, `FG_MUTED`, `WorkingIndicatorConfig`, `ThinkingIndicatorConfig` |
| `LICENSE` | `vendor/LICENSE` | none |

`index.ts` adapts `installPromptEditor`, `installIndicator`, `safeSessionName`, the user message transformer and the lifecycle handlers from upstream `src/index.ts`. Everything else in upstream `index.ts` was left out.

## Why `user-rail.ts` changed

Upstream detects an existing install by a marker on the current `render` function and keeps the rail color in module state. That breaks in two cases this setup hits:

1. pi-compact-tools wraps `UserMessageComponent.prototype.render` on top of the rail, which hides the marker, so a second session start adds a second rail.
2. `/reload` loads a fresh copy of the module. The old wrapper keeps reading the old module's color, so config changes do not apply.

The fix marks the prototype itself and keeps the color on `globalThis` under `Symbol.for("pi-pretty-compact.user-rail.state")`.

## Not vendored

Tool renderers (`src/tools/`), FFF search and autocomplete, Claude style patches, Shiki rendering, per-row thinking labels and the thinking shimmer. The thinking functions still exist inside `vendor/working-indicator.ts` because they share helpers with the working row, but `index.ts` never calls them.

## Updating

Diff upstream since the commit above, re-copy changed files, re-apply the two edits, and update this file.
