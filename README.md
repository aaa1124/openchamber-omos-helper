# openchamber-omos-helper — oh-my-opencode-slim preset editor for OpenChamber

An OpenChamber extension (rail panel + chat Work Status section) that edits the
presets `oh-my-opencode-slim` reads from
`~/.config/opencode/oh-my-opencode-slim.json[c]`:
per-agent **model**, **variant** and **skills**, plus which preset is the
default. It is the piece the TUI gives you and OpenChamber did not: a form
instead of hand-editing JSON.

It does not run agents, and it does not change how the plugin works. It only
writes the config file the plugin already reads.

## What it shows

- A compact **Work Status** section in the chat: the effective default preset,
  its agents and models, and which agents differ from the running server.
  Launched subagents from the current chat appear beneath their matching preset
  agent, with live activity and observed outcomes. Click a subagent to open its
  chat. While a subagent is working, retrying, or waiting for input, the preset
  agent's dot shows that activity; otherwise it shows the config comparison.
- Every preset in the user config, with the active default marked.
- One card per agent: model (`provider/model`, with the full OpenChamber model
  list as suggestions), variant, and skills (`*` for all).
- The agent's **effective** model as the running OpenCode server resolved it,
  and a warning when the file no longer matches — useful for spotting a preset
  that has not been applied to the current session.
- Project overrides under `.opencode/oh-my-opencode-slim.json` are detected and
  called out, because they win over the user file.

## Install

1. OpenChamber → **Settings → Extensions** → paste this folder's absolute path
   (`/Users/ben/Desktop/project2/openchamber-omos-helper`) into *Folder, ZIP, or URL*
   → **Add**.
2. Approve the local service when asked. The service is the Node process that
   reads and writes the config file; the panel is a sandboxed iframe and cannot
   touch the filesystem itself. Also approve the **Sessions** capability to
   show live subagents. The extension uses session metadata, not transcripts.
3. Open the **openchamber-omos-helper** icon in the rail.

The same data shows up as an **Agent presets** section in the chat's Work
Status panel. Hide or move it from the panel's section chooser; the section is
read-only and its **Open editor** button returns to the full editor. The preset
comparison still works when live session metadata is unavailable.

Folder installs use the local checkout after a reload. Git installs use a
separate copy; update it in **Settings → Extensions**.

## Editing behaviour

- Saves are span edits over the existing JSONC text: comments, key order and
  formatting elsewhere are preserved.
- The file is re-parsed before it is written; a patch that would produce
  invalid JSON is refused instead of saved.
- A copy of the previous bytes is written to
  `oh-my-opencode-slim.json.openchamber-omos-helper-backup` next to the config.
- Saving changes the file only. A running chat keeps its bound team until you
  run `/preset <name>` in that session; new sessions pick up the new values.

## Development

```bash
bun install          # @openchamber/sdk (already vendored in node_modules here)
bun run build        # builds panel/main.js, status/main.js and service/main.js
bun run check        # what OpenChamber would refuse at install
bun test             # live-session behavior
```

OpenChamber never compiles TypeScript or runs a build during install: the built
`panel/main.js`, `status/main.js` and `service/main.js` are committed and that
is what ships.

Layout:

```
package.json          manifest (apiVersion 1, panel + status section + service)
panel/index.html      markup and theme CSS
panel/main.ts         editor UI, built to panel/main.js
status/index.html     Work Status section markup and CSS
status/main.ts        compact readout, built to status/main.js
status/activity.ts    live session subscription for the current chat
service/main.ts       JSONC parser/patcher + OpenChamber API reads, built to service/main.js
icon.svg
```

The service reads the model registry and effective agent models from the local
OpenChamber API through `~/.config/openchamber/settings.json`
(`desktopLocalPort`, `desktopLocalClientToken`). If that is unavailable the
editor still works, with free-text model fields, and the Work Status section
reports running models as unavailable.

## License

MIT
