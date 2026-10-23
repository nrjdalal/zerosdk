# Run agents through a harness and a bridge

- Status: in progress (the `zerosdk` CLI's own install, its herdr step and `doctor` are built; the contracts, the routes and the rest of the setup are left)
- Links: [ADR 0005](../../docs/adr/0005-agents-run-in-cli-harnesses-through-a-bridge.md) · [ADR 0006](../../docs/adr/0006-the-server-answers-permission-requests.md) · [ADR 0014](../../docs/adr/0014-zerosdk-runs-its-own-pinned-herdr-in-its-own-herdr-session.md) · [ADR 0015](../../docs/adr/0015-agents-start-with-permissions-bypassed-and-the-flipper-comes-later.md) · [research](../../docs/research/0002-harness-bridge.md) · [the Session schema plan](0003-session-schema.md) · [the local data plan](0005-local-data.md) · PR #28

ZeroSDK runs each session of an agent as its own Claude Code CLI in a herdr pane on the user's machine, behind the harness and bridge contracts of ADR 0005, and starts them with permissions bypassed until the permission flipper of ADR 0006 is built, as ADR 0015 sets out.

## Decided

1. **The app runs locally** (2026-10-20): a hosted server cannot reach herdr or start `claude` on the user's machine.
2. **UI, server, bridge, CLI** (2026-10-20). Both the UI and the agents start new sessions through the server, agents through the `zerosdk` CLI, and the server records who started each one, since herdr keeps no parent.
3. **Agents talk as Claude Code peers** (2026-10-20), through cross-session messaging; each session's unique name is its peer address.
4. **CLIs first, the SDK later, and no ACP** (2026-10-20); the SDK comes as a second implementation of the same harness contract, with no change to the server.
5. **herdr first, cmux later** (2026-10-20), behind one bridge contract. The bridge is chosen in a setup step, where each bridge and harness checks itself, and the choice is saved in the database, not in an env setting, as the `bridge` and `harness` settings ([ADR 0013](../../docs/adr/0013-settings-are-one-typed-object-stored-a-row-per-setting.md)).
6. **Hooks and the screen from the start** (2026-10-20), hooks as the main signal and the screen as the fallback, as ADR 0005 sets out.
7. **Prompts are answered through the hook reply** (2026-10-20), with keys typed through the bridge as the fallback, as ADR 0006 sets out.
8. **A permission flipper on each main agent** (2026-10-20): Ask me, Rules or Allow all, for that main agent and every session under it, as ADR 0006 sets out; deferred (2026-10-23): agents start in `bypassPermissions` until it is built, as ADR 0015 sets out.
9. **No session waits on the workspace trust dialog** (2026-10-20): the server marks the repository's main checkout trusted once (`projects["<root>"].hasTrustDialogAccepted` in `~/.claude.json`), which covers its worktrees, since Claude Code keys a worktree's trust on the main checkout's root ([Claude Code](https://code.claude.com/docs/en/permissions#project-allow-rules-and-workspace-trust)). With a pool of Claude accounts, each signed in its own config directory, this is done once per account ([plan 0007](0007-claude-account-pool.md), [ADR 0012](../../docs/adr/0012-each-claude-account-signs-in-its-own-config-directory.md)).
10. **ZeroSDK's own herdr** (2026-10-23), as ADR 0014 sets out: the `zerosdk` CLI installs herdr 0.9.5, pinned and checked against its SHA-256, at `~/.zerosdk/bin/herdr`; ZeroSDK runs only that copy, by its full path, and only in herdr's named session `zerosdk`, passed as `--session zerosdk` on every call since herdr reads that flag before the `HERDR_SOCKET_PATH` it sets inside its own panes, so it runs a server apart from any herdr the human installed.
11. **`npx zerosdk-dev` sets everything up, then opens the app** (2026-10-23): a bare `zerosdk` walks every step ZeroSDK runs on, the database among them, skipping a step already done, then starts the app and opens it. Its first step installs the `zerosdk` command itself, globally, through the package manager behind the human's package runner (npm for npx), so `npx zerosdk-dev` is run once and `zerosdk` from then on. npx runs an installed copy for a bare name, so `npx zerosdk-dev@latest` is what brings a newer version, and its setup replaces the installed one; the app can run and manage each step too, from the same code. `zerosdk doctor` reports the same steps and changes nothing, under the name Claude Code gives that check (`claude doctor`). There is no `init`. The CLI runs under Node, through `npx`, and draws its output as zerostarter's CLI does. Its npm package is `zerosdk-dev`, after the zerosdk.dev domain, since npm refuses `zerosdk` as too close to the unrelated `zero-sdk`; its bin is still `zerosdk`, so a global install runs `zerosdk` and `zerosdk doctor`.
12. **Docker comes from OrbStack** (2026-10-23): when Docker is missing, the setup installs OrbStack, whose free tier covers personal, non-commercial use (work use is its paid Pro), and `zerosdk doctor` reports Docker missing or stopped. Whether it installs through Homebrew or OrbStack's own download, and how that download is checked, is settled when the step is built.
13. **macOS first** (2026-10-23): the factory targets macOS for now, so each setup step is built for macOS, and Linux follows later. herdr's Linux builds are pinned beside the macOS ones, since CI and the containers that check the CLI run Linux.
14. **The CLI publishes as zerostarter's does** (2026-10-23): `.github/workflows/cli-release.yml`, copied from zerostarter with Windows left out of its test matrix, publishes a `canary` prerelease whenever `packages/cli`, `packages/scripts` or `tests/` changes on `canary` (a test-only merge publishes one too), the release's version as `latest` once a release is cut, and a test build on the owner's `/release` comment, all through npm Trusted Publishing. It skips publishing until the human publishes `zerosdk-dev` to npm once by hand and adds the workflow as its trusted publisher on npmjs.com.

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
│   ├── cli/                        the `zerosdk` command, run through npx under Node; agents
│   │   │                             run it through Bash
│   │   ├── skill/SKILL.md          the one skill that teaches its agent commands
│   │   └── src/
│   │       ├── commands/           one file per command: setup (a bare `zerosdk`) and doctor
│   │       │                         now; memory, session and skill next, each one HTTP call
│   │       │                         to the server
│   │       ├── herdr.ts            the pinned herdr: its version, a SHA-256 per platform, the
│   │       │                         install
│   │       └── index.ts            the entry: help and dispatch
│   ├── harness/src/
│   │   ├── claude-code/
│   │   │   ├── cli.ts              now: drives the `claude` CLI through a Bridge
│   │   │   ├── hooks.ts            builds --settings (autoMemoryEnabled: false, hooks,
│   │   │   │                         statusLine), reads hook events
│   │   │   ├── screen.ts           the screen strings, the fallback signal
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

The server calls only the Harness contract, and only the CLI implementations use a Bridge, so adding `sdk.ts` or `cmux.ts` changes nothing else. `.github/scripts/build-sizes.ts`, synced from zerostarter, still leaves `packages/cli` out of the build-size graph, which charts the deployed apps. A custom status line, which a session's `resetsAt` needs, hides Claude Code's `esc to interrupt` hint, so the screen check and herdr rely on the title spinner to see a session working. The name of the sessions table waits on the [icebox: the sign-in session table](0002-auth-session-name.md), since the sign-in table is already called `session`.

## Steps

1. Write the two contracts as the Layout lists them, from section 10 of the research plus `check()` for the setup step, with the herdr bridge, which runs `~/.zerosdk/bin/herdr --session zerosdk` (decision 10), and the Claude Code CLI harness.
2. Add the server routes the Layout lists (hooks, memory, sessions, setup, skills) and the setup page that runs each `check()` and saves the choice.
3. Build the rest of the `zerosdk` CLI: the setup and `doctor` take on Docker next (decision 12), then Bun, Postgres and Claude Code, and the setup ends by starting the app once the built app ships in the npm package (decision 11); then the agent commands (memory, session, skill) and the one skill that teaches them. The herdr step and `doctor` came first.
4. Set each session's `harnessSessionId` once the harness reports it, and write every line the harness adds to its transcript as a `Message` on the Stop and SessionEnd hooks, the new lines only, skipping one whose uuid is stored ([ADR 0011](../../docs/adr/0011-a-session-s-messages-are-stored-whole-and-threads-group-them.md)). A resume rebuilds the transcript from the messages and names the session by that id; the settings it must pass again are rebuilt from the Agent and Session until [plan 0006](0006-handover-and-compaction.md)'s run record keeps them. Decide whether a message one agent sends another is tagged with its thread on the sending side only, since both sessions store it. tsrs, which checks every package's types, reports the type `Message` infers for its `z.json()` content as infinitely circular (TS5115), so code that names that type needs a way around it, as `tests/packages/schema/src/message.test.ts` reads each parsed message as `unknown`.
5. Compute the nine statuses in the harness from hook events, herdr's status and pattern events, and a no-progress timer.
6. Start each agent in the `permissionMode` setting with `--permission-mode`, and mark the main checkout trusted before the first session starts; answering permission requests by the flipper comes later (ADR 0015).
7. Keep the screen strings Claude Code prints (prompts, usage limits) in the Claude Code harness, with real screen captures as test fixtures.
8. Verify the whole flow on a real machine with herdr: start a session, send, answer, hit a prompt, interrupt, resume after a restart.
