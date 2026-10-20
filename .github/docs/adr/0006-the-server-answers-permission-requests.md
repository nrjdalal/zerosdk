# The server answers permission requests

Agents run in Claude Code's Manual permission mode (config value `default`), which reviews every action, so every request reaches the `PermissionRequest` hook, and the server answers it by the permission flipper on the main agent at the top of the session's tree, found through the session's recorded `root`: Ask me sends every request to the human, Rules allows what saved rules allow and asks the human about the rest, and Allow all allows every request. Questions are answered the same way through the `PreToolUse` hook, and keys typed through the bridge are only the fallback for a prompt that sends no hook. An answer by hook reaches the exact request Claude made, while a typed key can land in whatever dialog is open; the agents run on the user's own machine, unlike Cloudflare's container adapters, which start Claude Code with `--dangerously-skip-permissions`; and every answer passes through the server, which records what allowed it ([research](../research/harness-bridge-261020.md)).

Permission flipper is the user's word, which no source uses (0/9 with `bun run terms` on 2026-10-20). `permission modes?` (4/9: Claude Agent SDK, Claude Code, OpenAI Codex, Vercel AI SDK) names a harness's own setting, the one these agents keep at `default`, so calling the flipper a mode would give two settings one name.

## Considered Options

- **Flipping Claude's own mode:** Shift+Tab through the bridge means keystrokes into a live pane, one agent at a time, and nothing recorded.
- **`bypassPermissions`:** no request ever reaches the server, so the flipper would have nothing to answer.
