# pi-pretty-compact

pi-pretty's prompt box, user message prefix, user rail and working shimmer, rebuilt to run beside [pi-compact-tools](https://github.com/nedleeds/pi-compact-tools).

| Surface | Owner |
| --- | --- |
| Prompt editor: rounded box, `❯` colored by thinking level | pi-pretty-compact |
| `❯` prefix on user messages | pi-pretty-compact |
| User rail (optional) | pi-pretty-compact |
| Working row shimmer | pi-pretty-compact |
| Thinking display, Ctrl+T | pi-compact-tools |
| Tool rows | pi-compact-tools |
| Tool execution | pi |

This extension registers no tools, never sets the thinking label, and loads no Shiki, no FFF index and no file watcher. Its only imports are pi's own packages and Node builtins, so there is nothing to `npm install`.

## Install

1. Remove pi-pretty if you have it, because both claim the editor and working row:
   `pi remove npm:@heyhuynhgiabuu/pi-pretty`
2. Install pi-compact-tools at a pinned version:
   `pi install npm:pi-compact-tools@0.18.0`
3. Copy `examples/compact-tools.json` to `~/.pi/agent/compact-tools.json`.
4. Put this folder at `~/.pi/agent/extensions/pi-pretty-compact/`. pi auto-discovers it, and `/reload` picks up changes.
   To try it without installing: `pi -e ./pi-pretty-compact/index.ts`. Don't do both at once.
5. Restart pi and run `/compact-tools status`. Expect thinking on, working off.

## Config

Optional, at `~/.pi/agent/pi-pretty-compact.json`. Set `PI_PRETTY_COMPACT_CONFIG_DIR` to use another folder. See `examples/pi-pretty-compact.json`.

| Key | Default | Effect |
| --- | --- | --- |
| `prompt.boxed` | `true` | `false` gives plain rules with a flush-left `❯` (the Claude Code look) |
| `prompt.userIcon` | `true` | `❯` prefix on sent user messages, display only |
| `userRail` | unset | `#rrggbb` draws a one-cell bar left of user messages |
| `workingIndicator.enabled` | `true` | `false` hands the row back to pi |
| `workingIndicator.mode` | `shimmer` | `kitt` or `static` |
| `workingIndicator.text` | `Working…` | string or list of phrases |
| `workingIndicator.low` / `mid` / `high` | `dim` / `muted` / `accent` | theme color names or `#rrggbb` |
| `workingIndicator.sessionAccent` | `true` | stable tint per session name |
| `workingIndicator.intervalMs` | `33` | frame interval, minimum 33 |

The `PRETTY_WORKING_INDICATOR`, `PRETTY_WORKING_INDICATOR_TEXT`, `PRETTY_WORKING_INDICATOR_MODE` and `PRETTY_WORKING_INTERVAL_MS` environment variables still override the config file.

Prompt and config changes need a restart. The rail color applies at the next session start.

## Credits

Vendored from [pi-pretty](https://github.com/heyhuynhgiabuu/pi-pretty) by huynhgiabuu (MIT). See `VENDORED.md` and `vendor/LICENSE`.
