# Run agents through a harness and a bridge

- Status: planned
- Links: [research](../../docs/research/harness-bridge-261020.md) · [the Session schema plan](session-schema.md)

ZeroSDK runs each agent as its own Claude Code session. The app runs on the user's machine: the UI calls the server, the server starts and talks to sessions through a bridge, and the sessions message each other as Claude Code peers.

```
now:    UI ─► server ─► Harness ─► claude-code (cli) ─► Bridge ─► herdr ─► `claude` in a pane
later:  UI ─► server ─► Harness ─► claude-code (sdk) ─► @anthropic-ai/claude-agent-sdk
```

## Decided

1. **The app runs locally** (2026-10-20). A hosted server cannot reach herdr or start `claude` on the user's machine; zerosdk.dev stays the docs site.
2. **The flow is UI, server, bridge, CLI** (2026-10-20). Both the UI and the agents open new sessions through the server, which records who opened each one, since herdr keeps no parent.
3. **Agents talk as Claude Code peers** (2026-10-20), through cross-session messaging. Every session gets a unique name and `crossSessionInbound: "accept"`.
4. **CLIs first, no SDK and no ACP yet** (2026-10-20). The SDK route comes later as a second implementation of the same harness contract.
5. **The bridge is herdr first, cmux later** (2026-10-20), behind one bridge contract, chosen by one setting.
6. **Hooks and the screen, both from the start** (2026-10-20). Claude Code hooks passed at launch through `--settings` post events to the local server and are the main signal; the screen read through herdr is the backup, since Escape fires no hook.
7. **Prompts are answered through the hook reply** (2026-10-20): `PermissionRequest`, and `PreToolUse` for questions, so the answer reaches the exact question; keys typed through the bridge are only the fallback for a prompt that sends no hook.
8. **A permission flipper in each main agent's pane** (2026-10-20): Ask me, Rules or Allow all, deciding how the server answers permission requests for that main agent and every agent it started, followed down the recorded parents. The flip lives in the server, not in Claude: agents run in Claude Code's ask-first mode (`default`), so every request reaches the hook, and the server records each answer and what gave it.
9. **New worktrees are trusted in advance** (2026-10-20): the server marks each worktree it creates as trusted (`projects["<path>"].hasTrustDialogAccepted` in `~/.claude.json`, as Claude Code's permissions docs give it), so no session starts behind the workspace trust dialog.

## Layout

Approved 2026-10-20.

```
zerosdk/
├── api/hono/src/
│   ├── lib/
│   │   └── permissions.ts          the flipper (Ask me / Rules / Allow all) and the rules
│   └── routers/
│       ├── hooks.ts                where Claude's hook notes arrive
│       ├── memory.ts               what `zerosdk memory ...` calls
│       ├── sessions.ts             for the UI: open, send, answer, interrupt, stop, list
│       ├── setup.ts                runs each bridge's and harness's check(), saves the choices
│       └── skills.ts               what `zerosdk skill ...` calls
├── packages/
│   ├── bridge/src/
│   │   ├── cmux.ts                 later
│   │   ├── herdr.ts                now
│   │   └── index.ts                Bridge contract: open, sendText, sendKeys, prompt, read,
│   │                                 status, watch, snapshot, interrupt, close, check
│   ├── cli/                        the `zerosdk` command agents run through Bash
│   │   ├── skill/SKILL.md            the one skill that teaches its commands
│   │   └── src/index.ts              each command is one HTTP call to the local server
│   ├── harness/src/
│   │   ├── claude-code/
│   │   │   ├── cli.ts              now: drives the `claude` CLI through a Bridge
│   │   │   ├── hooks.ts            builds --settings (hooks, autoMemoryEnabled: false), reads hook notes
│   │   │   ├── screen.ts           the screen strings, the backup signal
│   │   │   ├── sdk.ts              later: drives the Claude Agent SDK
│   │   │   └── skills.ts           writes the agent's own skills into .claude/skills/
│   │   ├── opencode/
│   │   │   └── cli.ts              later
│   │   ├── index.ts                Harness contract: start, send, answer, interrupt, stop, watch,
│   │   │                             check
│   │   └── status.ts               turns signals into the nine statuses
│   └── schema/src/
│       └── session.ts              what a session is
└── tests/packages/harness/src/claude-code/
    └── screen.test.ts              checked against real screen captures
```

The server calls only the Harness contract, and only the CLI implementations use a Bridge, so adding `sdk.ts` or `cmux.ts` changes nothing else. The `runtime-apis` skill's rules for `packages/cli` (Node, `node:` only) apply to the `zerosdk` command, and its wording, which still describes zerostarter's npm CLI, gets updated with it. The bridge choice is saved in the database through a setup step, not an env setting, and the sessions table needs a name other than `session`, which the sign-in table holds (icebox #22).

## Steps

1. Write the harness and bridge contracts from section 10 of the research, with the bridge's herdr implementation and the harness's Claude Code CLI implementation.
2. Add the server routes that open a session, send a message, answer a prompt, interrupt, stop, and list sessions with their status, and the hook endpoints Claude Code posts to.
3. Store each session's Claude UUID and full launch settings beside its ZeroSDK id, so a resume can pass them again.
4. Compute the nine statuses in the harness from hook events, herdr's status and pattern events, and a no-progress timer.
5. Keep the screen strings Claude Code prints (prompts, usage limits) in the Claude Code harness, with real screen captures as test fixtures.
6. Verify the whole flow on a real machine with herdr: open a session, send, answer, hit a prompt, interrupt, resume after a restart.
