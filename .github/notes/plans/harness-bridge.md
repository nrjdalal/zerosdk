# Run agents through a harness and a bridge

- Status: planned
- Links: [ADR 0005](../../docs/adr/0005-agents-run-as-cli-harnesses-through-a-bridge.md) · [ADR 0006](../../docs/adr/0006-the-server-answers-permission-requests.md) · [research](../../docs/research/harness-bridge-261020.md) · [the Session schema plan](session-schema.md) · [the local data plan](local-data.md) · branch `docs/session-schema-plan`

ZeroSDK runs each agent as its own Claude Code CLI session in a herdr pane on the user's machine, behind the harness and bridge contracts of ADR 0005, and answers permission requests as ADR 0006 sets out.

## Decided

1. **The app runs locally** (2026-10-20): a hosted server cannot reach herdr or start `claude` on the user's machine.
2. **UI, server, bridge, CLI** (2026-10-20). Both the UI and the agents start new sessions through the server, agents through the `zerosdk` CLI, and the server records who started each one, since herdr keeps no parent.
3. **Agents talk as Claude Code peers** (2026-10-20), through cross-session messaging; each session's unique name is its peer address.
4. **CLIs first, the SDK later, and no ACP** (2026-10-20); the SDK comes as a second implementation of the same harness contract, with no change to the server.
5. **herdr first, cmux later** (2026-10-20), behind one bridge contract. The bridge is chosen in a setup step, where each bridge and harness checks itself, and the choice is saved in the database, not in an env setting.
6. **Hooks and the screen from the start** (2026-10-20), hooks as the main signal and the screen as the backup, as ADR 0005 sets out.
7. **Prompts are answered through the hook reply** (2026-10-20), with keys typed through the bridge as the fallback, as ADR 0006 sets out.
8. **A permission flipper on each main agent** (2026-10-20): Ask me, Rules or Allow all, for that main agent and every session under it, as ADR 0006 sets out.
9. **No session waits on the workspace trust dialog** (2026-10-20): the server marks the repository's main checkout trusted once (`projects["<root>"].hasTrustDialogAccepted` in `~/.claude.json`), which covers its worktrees, since Claude Code keys a worktree's trust on the main checkout's root.

## Layout

Approved 2026-10-20.

```
zerosdk/
├── api/hono/src/
│   ├── lib/
│   │   └── permissions.ts          the flipper (Ask me / Rules / Allow all) and the rules
│   └── routers/
│       ├── hooks.ts                where Claude's hook events arrive
│       ├── memory.ts               what `zerosdk memory ...` calls
│       ├── sessions.ts             for the UI and `zerosdk session`: start, send, answer,
│       │                             interrupt, stop, list
│       ├── setup.ts                runs each bridge's and harness's check(), saves the choices
│       └── skills.ts               what `zerosdk skill ...` calls
├── packages/
│   ├── bridge/src/
│   │   ├── cmux.ts                 later
│   │   ├── herdr.ts                now
│   │   └── index.ts                Bridge contract: open, sendText, sendKeys, prompt, read,
│   │                                 status, watch, snapshot, interrupt, close, check
│   ├── cli/                        the `zerosdk` command agents run through Bash: sessions,
│   │   │                             memory, skills
│   │   ├── skill/SKILL.md          the one skill that teaches its commands
│   │   └── src/index.ts            each command is one HTTP call to the local server
│   ├── harness/src/
│   │   ├── claude-code/
│   │   │   ├── cli.ts              now: drives the `claude` CLI through a Bridge
│   │   │   ├── hooks.ts            builds --settings (hooks, statusLine, autoMemoryEnabled:
│   │   │   │                         false), reads hook events
│   │   │   ├── screen.ts           the screen strings, the backup signal
│   │   │   ├── sdk.ts              later: drives the Claude Agent SDK
│   │   │   └── skills.ts           writes the agent's own skills into a folder passed with
│   │   │                             --add-dir
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

The server calls only the Harness contract, and only the CLI implementations use a Bridge, so adding `sdk.ts` or `cmux.ts` changes nothing else. `packages/cli` still means zerostarter's npm CLI in `AGENTS.md`, the `add-package`, `audit`, `codebase-map` and `runtime-apis` skills (its `index.md` too) and `.github/scripts/build-sizes.ts`, which leaves it out of the build-size graph; each gets updated when the `zerosdk` command lands there, and the `runtime-apis` rules (Node, `node:` only) apply to it. A custom status line, which `until` needs, hides Claude Code's `esc to interrupt` hint, so the screen backup and herdr fall back on the title spinner to see a session working. The name of the sessions table waits on the [icebox: the sign-in session table](auth-session-name.md), since the sign-in table is already called `session`.

## Steps

1. Write the two contracts as the Layout lists them, from section 10 of the research plus `check()` for the setup step, with the herdr bridge and the Claude Code CLI harness.
2. Add the server routes the Layout lists (sessions, hooks, memory, skills, setup) and the setup page that runs each `check()` and saves the choice.
3. Build the `zerosdk` CLI and the one skill that teaches its commands.
4. Store each session's Claude UUID and full launch settings beside its ZeroSDK id, so a resume can pass them again.
5. Compute the nine statuses in the harness from hook events, herdr's status and pattern events, and a no-progress timer.
6. Answer permission requests in the server by the flipper, and mark the main checkout trusted before the first session starts.
7. Keep the screen strings Claude Code prints (prompts, usage limits) in the Claude Code harness, with real screen captures as test fixtures.
8. Verify the whole flow on a real machine with herdr: start a session, send, answer, hit a prompt, interrupt, resume after a restart.
