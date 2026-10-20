# How ZeroSDK can drive agent CLIs: a harness contract over a bridge (2026)

Research date: 2026-10-20. Gathered by four research subagents from published TypeScript types (the npm `latest` release that day, read as text and never run), protocol schemas, official docs, and the source code of the tools below at the commits listed. It feeds the design of the flow ZeroSDK settled on: the UI calls the server, the server drives Claude Code through a bridge (herdr first, cmux later), and agents talk to each other as Claude Code peers; later the same server drives the Claude Agent SDK directly, with no bridge.

Labels: [Docs] official documentation · [Types] a published `.d.ts` · [Schema] a generated protocol schema · [Source] source code at the pinned commit · [Inferred] follows from two documented facts, stated nowhere · [Example] built from documented fields, not a captured output.

| Kind              | Sources and versions                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Harness libraries | Agent Client Protocol v1 and v2 · Anomaly OpenCode V2 `@opencode/client` and `@opencode/sdk` 2.0.32 · Claude Agent SDK `@anthropic-ai/claude-agent-sdk` 0.3.304 · Cloudflare Agents `agents` 0.28.1 · Mastra `@mastra/acp` 0.4.2, `@mastra/claude` 0.3.2, `@mastra/core` 1.78.0 · OpenAI Codex app-server schema at `rust-v0.163.0` and `@openai/codex-sdk` 0.163.0 · Vercel AI SDK `@ai-sdk/harness` 1.0.157 and `@ai-sdk/harness-claude-code` 1.0.161 |
| Bridges           | cmux 0.65.2 (github.com/manaflow-ai/cmux at `a5911a1`) · herdr 0.9.5 (github.com/herdrdev/herdr at `143bf5f`, API protocol 22) · tmux 3.8 · zellij 0.45.1                                                                                                                                                                                                                                                                                               |
| Claude Code       | https://code.claude.com/docs/en/ (agent-view, cli-reference, cross-session-messaging, env-vars, errors, hooks, interactive-mode, permissions, sessions, statusline) and the Agent SDK pages, Claude Code 2.1.304                                                                                                                                                                                                                                        |
| Multi-agent apps  | ccmanager (kbwo, `c6c6a41`) · Claude Squad (smtg-ai, `ce1ffb4`) · Emdash (generalaction, `ce0e562`) · Happy (slopus, `b99e7f8`) · Nimbalyst (Nimbalyst, `79b8c56`) · Omnara (omnara-ai, Claude wrapper at `245f4eb76c`) · Sculptor (imbue-ai, `7411f65`) · Superset (superset-sh, `20c265f7`) · T3 Code (pingdotgg, `67c0fc0c`) · uzi (devflowinc, `421685f`) · vibe-kanban (BloopAI, `d5cbb53`)                                                        |

## Contents

1. [Two contracts](#1-two-contracts)
2. [The harness contract](#2-the-harness-contract)
   - [What every source has](#what-every-source-has) · [What the names are](#what-the-names-are) · [Identity](#identity)
3. [The bridge contract](#3-the-bridge-contract)
   - [What each bridge can do](#what-each-bridge-can-do) · [herdr](#herdr) · [cmux](#cmux)
4. [Claude Code on both routes](#4-claude-code-on-both-routes)
   - [Start and resume](#start-and-resume) · [Send](#send) · [Answer](#answer) · [Interrupt and stop](#interrupt-and-stop) · [Usage limits](#usage-limits)
5. [Where each status comes from](#5-where-each-status-comes-from)
6. [Peers across routes](#6-peers-across-routes)
7. [How multi-agent apps drive CLIs today](#7-how-multi-agent-apps-drive-clis-today)
8. [Pitfalls](#8-pitfalls)
9. [Demos](#9-demos)
   - [Every kind Claude Code shows](#every-kind-claude-code-shows): [A permission prompt](#a-permission-prompt-claude-code) · [A usage limit](#a-usage-limit-claude-code) · [Hooks to a local server](#hooks-to-a-local-server-claude-code)
   - [Kinds Claude Code lacks](#kinds-claude-code-lacks): [A status event from a bridge](#a-status-event-from-a-bridge-herdr) · [A pattern watched for you](#a-pattern-watched-for-you-herdr) · [An answer as a function return](#an-answer-as-a-function-return-claude-agent-sdk)
10. [What it means for ZeroSDK](#10-what-it-means-for-zerosdk)

---

## 1. Two contracts

```
now:    UI ─► server ─► Harness ─► claude-code (cli) ─► Bridge ─► herdr ─► `claude` in a pane
later:  UI ─► server ─► Harness ─► claude-code (sdk) ─► @anthropic-ai/claude-agent-sdk
```

The server calls one **harness** contract for every agent session, whatever runs underneath. Only the CLI implementation uses the **bridge** contract, which drives the terminal panes a bridge hosts. The split has precedent: the AI SDK's Claude Code adapter is a `HarnessV1` that hides its own bridge process and sandbox behind the contract ("The adapter ships a bridge process that runs inside a sandbox and talks to the host over a WebSocket", `@ai-sdk/harness-claude-code` README [Docs]), and the Claude Agent SDK's own `bridge` export is the transport that connects a session to claude.ai for Remote Control (`BridgeSessionHandle`, "Per-session bridge transport handle" [Types]).

## 2. The harness contract

### What every source has

Seven harness libraries define "drive one coding-agent session": ACP, OpenCode V2, the Claude Agent SDK, Cloudflare Agents, Mastra, the Codex app-server and the AI SDK harness, here in that order.

| Operation                                | Sources                                                   | Count |
| ---------------------------------------- | --------------------------------------------------------- | ----- |
| send a prompt (a new turn)               | all                                                       | 7     |
| interrupt the running turn               | all (Mastra and AI SDK through an `AbortSignal`)          | 7     |
| an event stream                          | all                                                       | 7     |
| answer a permission                      | all (Cloudflare's container harness bypasses permissions) | 7     |
| create or start                          | all but Mastra, which starts on the first call            | 6     |
| resume                                   | ACP, Claude, Cloudflare, Codex, AI SDK                    | 5     |
| answer a question                        | ACP, OpenCode, Claude, Codex, AI SDK                      | 5     |
| end the session                          | ACP, OpenCode, Claude, Codex, AI SDK                      | 5     |
| fork, read history, list sessions        | ACP, OpenCode, Claude, Cloudflare, Codex (each)           | 5     |
| status pushed as events                  | ACP v2, OpenCode, Claude, Cloudflare, Codex               | 5     |
| steer a running turn                     | OpenCode, Cloudflare, Codex, AI SDK                       | 4     |
| set model or mode mid-session            | ACP, OpenCode, Claude, Cloudflare                         | 4     |
| status pulled by a call, compact, detach | 3 each                                                    | 3     |

Every source keeps **interrupting a turn** (7 of 7) apart from **ending the session** (5 of 7), and three also keep **detaching** apart (Cloudflare `dispose`, Codex `thread/unsubscribe`, AI SDK `detach`). Steering is a delivery choice on the send call in two of the four that have it: OpenCode `session.prompt({ delivery: 'steer' | 'queue' })` and Cloudflare `submit({ whenBusy: 'steer' | 'followUp' })`, where a harness that cannot steer queues instead. Every answer is keyed by an id the harness issued, and all but Cloudflare can decline (ACP `cancelled`, OpenCode `reject`, Claude `deny`, Codex `decline`, AI SDK `approved: false`). Claude and Cloudflare answer permissions and questions through one call; ACP, OpenCode and Codex keep two.

Status is reported, not stored, in most of them. `pending` is a native value in 3 of 7 and `running` in 6; a distinct value for waiting on the user exists in 5 (ACP v2 and Claude `requires_action`, Mastra `suspended`, Codex `waitingOnApproval` and `waitingOnUserInput`, AI SDK `awaiting-approval`); `idle` is native in 5 and `paused` in 4 with four different meanings; `stuck` in none. Turn outcome (`completed`, `failed`, `cancelled`) and session status (`running`, `idle`) are separate axes in every source that has both.

The AI SDK expresses optional operations as optional methods that throw `HarnessCapabilityUnsupportedError` when absent; ACP and Codex negotiate capabilities at `initialize` [Types, Schema].

### What the names are

| Operation  | Names, by how many sources use them                                                                  |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| start      | `create` 3, `start` 2, `new` 1, `query` 1                                                            |
| resume     | `resume` 5, `load` 1                                                                                 |
| send       | `prompt` 4, `generate` / `stream` 2, `streamInput` 1, `submit` 1, `turn/start` 1                     |
| steer      | `steer` 4                                                                                            |
| answer     | `permission` 4 and `approval` 3 for the request; `elicitation` 3 and `question` 3 for the other kind |
| interrupt  | `abort` 3, `interrupt` 3, `cancel` 1                                                                 |
| end        | `delete` or `remove` 4, `close` 2, `stop` 2, `archive` 1, `destroy` 1                                |
| status     | `status` 3, `state` 2, `busy` 1                                                                      |
| list, fork | `list` 5, `fork` 6 (Mastra's only as a `forkSession` it passes to Claude)                            |

### Identity

The harness assigns the session id in all 7; the caller may choose it in 3 (OpenCode `session.create({ id })`, Claude `sessionId`, AI SDK `createSession({ sessionId })`). Wherever a wrapper sits over a harness (Cloudflare over a CLI, Mastra over ACP, AI SDK over Claude or Codex), two ids coexist: the wrapper's own, and the harness's, kept as an opaque resume payload. OpenCode's id is server-assigned (`ses_` plus a descending id); Claude's must be a UUID on both routes ("must be a valid UUID", `--session-id` and `sessionId` [Docs, Types]); Codex's is a UUIDv7.

## 3. The bridge contract

### What each bridge can do

| Operation                                 | herdr 0.9.5                                                                    | cmux 0.65.2                                                                                  | tmux 3.8                       | zellij 0.45.1                       |
| ----------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------- |
| open a pane with command, cwd, env, label | `layout.apply` in one call; or `pane.split` + `pane.rename` + `agent.start`    | `workspace.create`, `surface.split`, `pane.create` with `initial_command` or `initial_input` | `split-window -c -e -T cmd`    | `new-pane --cwd -n -- cmd`, no env  |
| start an agent and wait until it is ready | `agent.start` (returns when ready, or `agent_not_ready`)                       | none (screen wait)                                                                           | none                           | none                                |
| send text, send keys                      | `pane.send_text`, `pane.send_keys`, `pane.send_input`, `agent.prompt`          | `surface.send_text`, `surface.send_key`, `terminal.paste`                                    | `send-keys`, `paste-buffer -p` | `write-chars`, `send-keys`, `paste` |
| read the screen, read scrollback          | `pane.read` with `source` `visible`, `recent`, `recent_unwrapped`, `detection` | `surface.read_text` with `scrollback`, `lines`                                               | `capture-pane -p -S -E`        | `dump-screen --full`                |
| agent status                              | `idle`, `working`, `blocked`, `done`, `unknown` (screen rules)                 | `unknown`, `running`, `idle`, `needsInput` (hooks)                                           | none                           | none                                |
| status events                             | `pane.agent_status_changed` per pane                                           | derived from `agent.hook.*` events                                                           | control mode, hooks            | none outside plugins                |
| output pattern events                     | `pane.output_matched` with a substring or regex                                | `surface.wait_text_change` (change only)                                                     | `%output` stream               | `subscribe` stream                  |
| list, close, human attach                 | yes                                                                            | yes                                                                                          | yes                            | yes                                 |
| survives a server restart                 | pane ids, labels, cwd, the agent's session ref; not tokens, env or agent names | layout, workspace env, titles, hook session records                                          | no                             | layout, commands behind a banner    |
| access                                    | Unix socket, mode `0600`, no token                                             | `cmuxOnly` by default (only processes started inside cmux), `password`, `allowAll`           | socket permissions             | local socket                        |
| platform                                  | Linux, macOS, Windows beta                                                     | macOS only                                                                                   | Unix                           | Linux, macOS                        |

No agent library's sandbox interface (OpenCode `WorkspaceDriver`, OpenAI `SandboxClient`, the AI SDK sandbox provider, eve `defineSandboxProvider`) models a pane, a screen or an agent status; they model a process and filesystem sandbox. Three of their patterns carry over: create is idempotent by a caller-owned id ("MUST be idempotent per `workspaceID`", OpenCode [Types]); the provider returns an opaque binding that the core stores and hands back ("Smallest provider-owned JSON value required to reconnect", OpenCode [Types]); and resume tolerates the resource being gone ("treating absence as success").

### herdr

- **One schema, generated.** `herdr api schema --json` prints a JSON Schema embedded in the binary and generated from its Rust types, with a test that fails when they drift; it declares 102 methods. Requests are newline-delimited JSON over a Unix socket at `~/.config/herdr/herdr.sock` [Source].
- **No single run call.** The CLI's `herdr pane run` is the `pane.send_input` method. Only `layout.apply` starts a pane with an argv, and an argv pane closes when its process exits. `agent.start { name, kind, pane_id, args }` launches an agent into an idle shell pane and "returns only after the expected agent owns the same terminal and is ready for interactive input" [Docs].
- **Claude's status comes from the screen.** Rules in `src/detect/manifests/claude.toml` map the title spinner and `esc to interrupt` to `working`, permission and form dialogs to `blocked`, and the `❯` prompt box to `idle`. "If no manifest rule matches for a known agent, Herdr falls back to `idle` [...] idle status is not authorization to approve an action." `herdr integration install claude` adds only a `SessionStart` hook that reports the session id, so `claude --resume` works after a restart [Docs, Source].
- **`done` is `idle` not yet seen.** "`idle` and `done` both mean ready for input"; `completion_seq` tells whether the last idle transition finished work [Docs, Schema].
- **Prompts through `agent.prompt`** write the text and a delayed Enter as one ordered submission, and refuse with `agent_blocked` while a dialog is up; with `wait`, no `working` or `blocked` within 5 s returns `agent_prompt_stalled`, which "does not prove the prompt was never delivered" [Docs].
- **Events are invalidation signals.** Subscriptions do not replay; a subscriber that falls behind gets `events_lost` and must resubscribe and read `session.snapshot` [Docs].
- **Reading a busy agent's history** from the alternate screen returns `agent_not_idle`; herdr's advice is to have the agent write long results to a file [Docs].

### cmux

- A Ghostty-based macOS app; its socket lives only while the app runs. "`cmuxOnly`: Only processes spawned inside cmux terminals can connect" is the default, so a server started elsewhere needs `password` or `allowAll` [Source].
- Claude's status comes from hooks: a `claude` wrapper injects `--session-id` and `--settings` with `SessionStart`, `UserPromptSubmit`, `Stop`, `StopFailure`, `Notification` and `PermissionRequest` hooks. `surface.input_state` reports `lifecycle` (`unknown`, `running`, `idle`, `needsInput`) and whether a draft or dialog would catch typed text [Source].
- The CLI's `send` refuses to type into a non-empty draft or an open dialog unless `--force`; the raw socket `surface.send_text` does not check, so a bridge must call `surface.input_state` first [Docs].
- `events.stream` replays up to 4,096 events by `seq`, but has no agent-lifecycle event and no output-pattern subscription [Docs].

## 4. Claude Code on both routes

### Start and resume

| Concern                      | CLI route                                                                                 | SDK route                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| session id                   | `--session-id <uuid>`                                                                     | `sessionId`                                          |
| name (also the peer address) | `--name`                                                                                  | `title`                                              |
| model, effort, mode          | `--model`, `--effort`, `--permission-mode`                                                | `model`, `effort`, `permissionMode`                  |
| hooks and other settings     | `--settings <file or json>`                                                               | `settings`, `hooks` as in-process callbacks          |
| resume                       | `claude --resume <id>`                                                                    | `resume`                                             |
| first launch in a new folder | the workspace trust dialog appears; pre-seed `hasTrustDialogAccepted` in `~/.claude.json` | "A `claude -p` run or an SDK session never shows it" |

Both routes write one transcript store, `~/.claude/projects/<encoded-cwd>/<session-id>.jsonl`; the CLI can resume an SDK session by id [Docs], and the reverse follows from the same store [Inferred]. A resume does not restore `--add-dir`, `--mcp-config`, `--plugin-dir` or `--settings` ("pass them again when you resume" [Docs]), and opening one session in two processes interleaves its transcript [Docs]. `CLAUDE_CODE_CHILD_SESSION=1`, set in every Bash and hook subprocess, hides a nested TUI from `--resume` and from `claude agents` unless `CLAUDE_CODE_FORCE_SESSION_PERSISTENCE=1` [Docs].

### Send

Typing while Claude works queues the message: "Claude Code queues the message instead of interrupting the turn", and passes it on "as soon as those tool calls finish, within the same turn" [Docs]. `Ctrl+X Ctrl+S` sends now; `Ctrl+Enter` does too, but arrives as plain Enter in terminals that do not report extended keys [Docs]. A leading `/` runs a command, `!` a shell command and `@` a file mention. The SDK route has `priority` (`now`, `next`, `later`), `shouldQuery: false`, `client_composed` for text taken as written, and `origin: { kind: "human" }` to say who speaks; on the CLI route **everything typed is the human**, so text a bridge types carries the human's authority [Docs, Types].

### Answer

The permission prompt asks "Do you want to proceed?" with numbered choices and the footer keys `Esc to cancel` and `Tab to amend`; `Esc` "declines the action, the same as **No** without a comment", and a plain **No** on the main conversation stops the turn [Docs]. Prompts "never auto-resolve on idle" [Docs]. The CLI route can also answer without keys: a `PermissionRequest` hook returns `allow` or `deny`, and a `PreToolUse` hook answers `AskUserQuestion` with `permissionDecision: "allow"` and `updatedInput.answers` ("Returning `"allow"` alone is not sufficient for these tools") [Docs]. `--permission-prompt-tool` is ignored by the interactive CLI ("verified live, 2.1.168", Nimbalyst [Source]). A message from another session "never counts as your consent" [Docs].

### Interrupt and stop

`Esc` stops the current response or tool call and keeps the work so far; `Ctrl+C` with nothing running clears the input, and a second press exits; `/exit` ends the session [Docs]. The SDK has `interrupt()` and `close()` [Types].

### Usage limits

The TUI waits and continues by itself; the SDK never waits. On the SDK route a `rate_limit_event` with `status: "rejected"` carries an epoch `resetsAt`, and the caller schedules the resume [Types]. On the CLI route the epoch reaches only the status-line command (`rate_limits.*.resets_at`, one per window: five-hour, seven-day and spend limit, each with its `used_percentage`), and only "for claude.ai Pro and Max subscribers, or behind a Claude apps gateway that sets a spend limit for you, and only after the first API response in the session" [Docs], a `StopFailure` hook fires with `error: "rate_limit"`, and `Notification` hooks fire as `quota_auto_resume_*` [Docs]. The on-screen reset time is a local clock time such as `3:45pm`, or a weekday and time such as `Mon 12:00am`, with no date [Docs], and Nimbalyst notes the wording varies ("resets 11:40am (TZ)", `usageLimit.ts` [Source]), so it is a signal to match, not a time to parse. No multi-agent app on the TUI route detects a usage limit from the screen: Nimbalyst catches HTTP 429 through a proxy, and Happy, Nimbalyst, Sculptor and T3 Code classify it on headless streams [Source].

## 5. Where each status comes from

| ZeroSDK   | CLI route (herdr, Claude Code TUI)                                                                        | SDK route                                          |
| --------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| pending   | pane open, agent not ready (`agent.start` in flight, `launch_pending`), or the trust dialog on screen     | before the `system` init message                   |
| running   | herdr `working`                                                                                           | `session_state_changed` `running`                  |
| waiting   | herdr `blocked`; `claude agents --json` `status: "waiting"` with `waitingFor`; `PermissionRequest` hook   | `requires_action`; a `canUseTool` call outstanding |
| idle      | herdr `idle` or `done`; `Stop` hook                                                                       | `idle` and a `result` with `is_error: false`       |
| paused    | the usage-limit lines on screen; `StopFailure` `error: "rate_limit"`; `quota_auto_resume_*` notifications | `rate_limit_event` `rejected` with `resetsAt`      |
| stuck     | herdr `working` with no screen `revision` change, or `unknown`, past a threshold; `agent_prompt_stalled`  | no messages but heartbeats past a threshold        |
| completed | the session's work is done (a ZeroSDK verdict; herdr reports no exit code)                                | same                                               |
| failed    | `StopFailure` with another error; `API Error:` text; the process ends unexpectedly                        | `result.is_error: true` with a `terminal_reason`   |
| cancelled | ZeroSDK interrupted or closed it                                                                          | `interrupt()`, `close()`                           |

`stuck`, `completed` and `cancelled` are ZeroSDK's own verdicts on both routes: no bridge reports them, and nobody has a general stuck detector. The nearest are 30 s with no transcript (Happy), a 600 s watchdog (Nimbalyst), 60 s of silence after an interrupt (Sculptor) and 10 s with no hook after a send (Superset) [Source]. herdr's `unknown` should stay a value of its own, not fold into `idle`.

## 6. Peers across routes

Claude Code's cross-session messaging lets sessions on one machine message each other "Over a per-session socket [...] never through Anthropic servers", and a message reaches an idle session as a new turn [Docs]. A `claude -p` session binds the same inbox as an interactive one, and an SDK session receives peer turns as `origin: { kind: "peer" }` with a kernel-verified `verifiedPeerPid` [Docs]; it sends through the same `SendMessage` tool [Inferred]. So an SDK AgentZero and CLI subagents in herdr panes can talk both ways when:

1. Every session runs Claude Code v2.1.224 or later, as the same OS user, on the same side of any container boundary ("A session inside a container and a session on the host can't reach each other") [Docs].
2. No session runs in bare mode [Docs].
3. A session that bypasses permission prompts sets `crossSessionInbound: "accept"` through `--settings` or the SDK's `settings`. With no value set, a session that prompts delivers every message unless the sender bypasses prompts, and a session that bypasses holds every message unless the sender also bypasses; "A `-p` session can't show the approval dialog", so a held message drops after five minutes [Docs].
4. Every session has a unique name (`--name` or `title`), its peer address [Docs].

Messages are plain text, about one million characters at most, and cannot approve prompts or run commands [Docs]. Only the auth line of the inbox socket is documented, so a server writing to it directly would rely on an undocumented format [Docs].

## 7. How multi-agent apps drive CLIs today

| Tool, route               | Start                                    | Send into a running session                              | Answer a permission                      | Detect waiting                               | Detect idle                             | Detect a usage limit                 | Stop                               |
| ------------------------- | ---------------------------------------- | -------------------------------------------------------- | ---------------------------------------- | -------------------------------------------- | --------------------------------------- | ------------------------------------ | ---------------------------------- |
| ccmanager, TUI            | `claude` in a pty                        | the user only                                            | Enter after a model's verdict (optional) | `do you want`, `esc to cancel`               | no busy marker for 1.5 s                | no                                   | kill the pty                       |
| Claude Squad, TUI in tmux | `tmux new-session -d ... claude`         | pty write, 100 ms, then `\r`                             | Enter on the default (auto-yes)          | `No, and tell Claude what to do differently` | pane hash unchanged for one 500 ms tick | no                                   | `tmux kill-session`                |
| Emdash, TUI               | `claude --session-id <id>` in node-pty   | raw pty write, separate `\r`                             | the human                                | `Notification` hook                          | `Stop` hook                             | no                                   | SIGTERM to the group, then SIGKILL |
| Nimbalyst, TUI            | `claude --session-id <uuid>` in node-pty | bracketed paste, gap scaled by bytes, `\r`               | `PreToolUse` hook `permissionDecision`   | the session's PID file says `waiting`        | PID file `idle`                         | a proxy sees HTTP 429                | Ctrl+C twice, SIGINT               |
| Omnara (legacy), TUI      | `claude --session-id <id>` in a pty      | text, 0.25 s, `\r`                                       | parse `Do you want` and type the digit   | idle after a tool use                        | 3.5 s without `esc to interrupt`        | no                                   | SIGTERM                            |
| Sculptor, TUI             | command typed into a login shell         | bracketed paste, 0.75 s, `\r`, only when idle or waiting | the human                                | `Notification` and `PreToolUse` hooks        | `Stop`, `idle_prompt` hooks             | no                                   | close the pty                      |
| Superset, TUI             | argv typed into a shell                  | bracketed paste, 500 ms, `\r`, serialized                | keys only                                | `PermissionRequest`, `Notification` hooks    | `Stop` hook                             | `StopFailure` read as failed         | Esc or Ctrl+C, SIGHUP              |
| T3 Code, SDK              | `query()` with `sessionId`               | queued; steer with `priority: "now"`                     | `canUseTool`                             | a pending request                            | the `result`                            | `rate_limit_event`, 429, `api_retry` | `interrupt()`, then `close()`      |
| uzi, TUI in tmux          | `send-keys 'claude "<prompt>"' C-m`      | `send-keys <msg> Enter`                                  | Enter on prompt substrings               | `Do you want to`, `Allow command`            | no `esc to interrupt` or `Thinking`     | no                                   | `tmux kill-session`                |
| vibe-kanban, headless     | `claude -p --output-format=stream-json`  | one queued message, run after exit                       | `control_response` to `can_use_tool`     | an approval request row                      | the `result`, then exit                 | parsed, ignored                      | stdin interrupt, then signals      |

On the TUI route, status comes from hooks (Emdash, Sculptor, Superset), the session's PID file (Nimbalyst) or screen text (ccmanager, Claude Squad, Omnara, uzi). Hooks miss a user's Escape and interrupts; screen reading misreads redraws [Source]. Every tool that answers permissions by program does it headless or through a `PreToolUse` hook; tools that answer by keys only press Enter on the highlighted default or type a digit after parsing the screen [Source].

## 8. Pitfalls

Sending text into a TUI:

1. Send the Enter in its own write, after the text: in one burst Claude Code treats the text as a paste and the `\r` becomes a newline in the draft (Sculptor, Superset). Gaps in use run from 100 ms to 0.75 s; Sculptor notes about 0.2 s suffices [Source].
2. Wrap the text in bracketed paste, and scale the gap by bytes: the OS splits a large write and Claude Code counts each part as a paste (Nimbalyst) [Source].
3. Serialize sends to one session; a second send can land between the first one's text and its Enter (Superset) [Source].
4. Clean the text: `\n`, `\r`, `\t` and escape characters act as keys, a tab autocompletes, a leading `/` runs a command and `!` a shell command (Nimbalyst, Superset) [Source].
5. A message typed while a dialog is open answers the dialog; herdr's `agent.prompt` refuses with `agent_blocked`, and cmux's raw send does not check [Docs, Source].
6. Keep a typed launch command under macOS's 1,024-byte line limit, or the shell waits at `quote>` (Superset) [Source].
7. Strip inherited `CI`, `CLAUDECODE` and `TMUX` from a pane's environment (ccmanager, Nimbalyst, Sculptor) [Source].

Status:

1. No hook fires on a user's Escape or interrupt, so a hook-driven `running` or `waiting` can stick (Superset) [Source].
2. `Notification` `idle_prompt` fires about 60 s after a turn ends and is not a question; the permission notification lags its `PermissionRequest` by about 6 s [Docs]. Whether `Notification` carries `notification_type` depends on the Claude Code version (Emdash says no; Sculptor matches on it) [Source].
3. A subagent's hooks must not drive its parent session's status (Superset) [Source].
4. Hooks in global settings fire for every session on the machine; guard on an environment variable only managed panes have (Emdash, Superset) [Source].
5. Screen-based idle needs debouncing (1.5 s in ccmanager), and a hash of the whole pane reads any repaint as busy and a stuck TUI as idle (Claude Squad) [Source].
6. A custom status line hides `esc to interrupt` [Docs].

Session ids and stopping:

1. No transcript exists until the first message, so resuming an id earlier fails (Sculptor, Superset, T3 Code) [Source].
2. `--session-id` fails with "Session ID <uuid> is already in use." once the id is on disk; use `--resume` from then on (Nimbalyst, T3 Code) [Source].
3. The id changes on an in-TUI `/resume`, and `/clear` starts a new transcript; take the id from every hook payload (Emdash, Omnara) [Source].
4. Ctrl+C at an idle prompt arms "press again to exit" (Nimbalyst) [Source], and SIGTERM to a wrapper orphans the real binary, so signal the process group (Emdash, Happy, Sculptor, vibe-kanban) [Source].

## 9. Demos

### Every kind Claude Code shows

#### A permission prompt (Claude Code)

[Docs] https://code.claude.com/docs/en/permissions, the Bash prompt laid out from its screenshot's alt text, which gives the words but not the layout; the third choice "doesn't appear on every prompt":

```text
Bash command
  npm test
  This command requires approval

Do you want to proceed?
  Yes
  Yes, and don't ask again for: npm test *
  Yes, and switch to auto mode
  No

Esc to cancel · Tab to amend
```

#### A usage limit (Claude Code)

[Docs] https://code.claude.com/docs/en/interactive-mode, the lines shown while it waits, then at the reset:

```text
Usage limit reached · limit resets 3:45pm
Continuing automatically at 3:45pm · esc to cancel

Continuing shortly · esc to cancel
Usage limit reset · continuing automatically
```

#### Hooks to a local server (Claude Code)

[Example] a `--settings` value built from the documented HTTP hook fields at https://code.claude.com/docs/en/hooks, sending a pane's permission requests and turn failures to a server on this machine:

```json
{
  "hooks": {
    "PermissionRequest": [
      { "hooks": [{ "type": "http", "url": "http://localhost:4000/hooks/permission-request" }] }
    ],
    "StopFailure": [
      { "hooks": [{ "type": "http", "url": "http://localhost:4000/hooks/stop-failure" }] }
    ]
  }
}
```

### Kinds Claude Code lacks

#### A status event from a bridge (herdr)

Claude Code reports its status to its own hooks and `claude agents --json`; herdr pushes every pane's status on one subscription. [Source] the frame shapes herdr's own tests expect after a subscribe request (`tests/api_ping.rs`), with a pane id filled in:

```json
{"id":"sub_1","result":{"type":"subscription_started"}}
{"event":"pane.agent_status_changed","data":{"pane_id":"w1:p1","agent_status":"idle","agent":"pi"}}
```

#### A pattern watched for you (herdr)

Claude Code has no way to tell an outside program that a line appeared. herdr matches it. [Example] a subscription built from herdr's schema (`src/api/schema/events.rs`), watching one pane for the usage-limit line:

```json
{
  "id": "sub_2",
  "method": "events.subscribe",
  "params": {
    "subscriptions": [
      {
        "type": "pane.output_matched",
        "pane_id": "w1:p1",
        "source": "visible",
        "match": { "type": "regex", "value": "^Usage limit reached" },
        "strip_ansi": true
      }
    ]
  }
}
```

#### An answer as a function return (Claude Agent SDK)

Claude Code answers a permission from outside its process, through a hook that a command or an HTTP endpoint replies to, or through keys. On the SDK route the answer is the return value of a callback in the same process. [Example] built from the types in `@anthropic-ai/claude-agent-sdk` 0.3.304:

```ts
import { query } from "@anthropic-ai/claude-agent-sdk"

const session = query({
  prompt: "Fix the login bug",
  options: {
    sessionId: "6f1c2a4e-3b7d-4c8e-9a10-2b3c4d5e6f70",
    canUseTool: async (toolName, input) =>
      toolName === "Bash"
        ? { behavior: "deny", message: "Ask the human first" }
        : { behavior: "allow", updatedInput: input },
  },
})
```

## 10. What it means for ZeroSDK

The evidence shapes the two contracts like this. Names are working names.

```ts
// The server's one way to run an agent session, on any route
type Harness = {
  start(input: { session: Id; resume?: unknown; launch: Launch }): Promise<{ resume: unknown }>
  send(session: Id, text: string, options?: { delivery?: "queue" | "steer" }): Promise<void>
  answer(
    session: Id,
    request: string,
    reply: PermissionReply | QuestionReply | { cancel: true },
  ): Promise<void>
  interrupt(session: Id): Promise<void>
  stop(session: Id): Promise<void>
  watch(session: Id, onChange: (status: Status, reason?: string) => void): () => void
}

// What a CLI harness uses to drive the panes a bridge hosts
type Bridge = {
  open(input: {
    cwd: string
    env: Record<string, string>
    label: string
    agent?: { kind: string; name: string; args: string[] }
  }): Promise<{ pane: string; binding: unknown }>
  sendText(pane: string, text: string): Promise<void>
  sendKeys(pane: string, keys: string[]): Promise<void>
  prompt(pane: string, text: string): Promise<void>
  read(
    pane: string,
    options?: { source?: "visible" | "scrollback"; lines?: number },
  ): Promise<{ text: string; revision: number }>
  status(pane: string): Promise<"working" | "waiting" | "idle" | "unknown" | "exited">
  watch(handlers: {
    status?: (pane: string, status: string) => void
    match?: { pattern: RegExp; pane: string; onMatch: (line: string) => void }[]
    exited?: (pane: string) => void
  }): () => void
  snapshot(): Promise<{ pane: string; label: string; status: string }[]>
  interrupt(pane: string): Promise<void>
  close(pane: string): Promise<void>
}
```

- **start** folds in resume and keeps the harness's own session id as an opaque `resume` payload beside ZeroSDK's own `Id`, as Cloudflare and the AI SDK do; for Claude that payload holds its UUID and the full launch settings, since a resume does not restore them.
- **send** takes a delivery choice: Claude queues by default, OpenCode V2 steers by default ("While OpenCode is working, Enter steers the active session" [Docs]).
- **answer** is one call for both kinds, with a cancel.
- **interrupt** and **stop** stay apart, as in every source.
- **watch** emits ZeroSDK's nine statuses, which the harness computes; `stuck`, `completed` and `cancelled` are its own verdicts.
- **The bridge returns an opaque binding** and the server keeps the session-to-pane map, since herdr does not keep tokens or agent names across a restart.

Questions this leaves for the user:

1. **Screen only, or screen plus hooks.** The CLI route can read status from the screen and herdr alone, or also take Claude Code's hooks and `claude agents --json`, which every hook-based multi-agent app uses and which can answer prompts without keys.
2. **How prompts get answered.** Keys typed through the bridge, or a `PermissionRequest` and `PreToolUse` hook.
3. **The permission mode agents run in.** It decides which prompts appear and how peers' messages are held.
4. **First launch per worktree.** Pre-seed the trust dialog, or let the session start as `pending` until someone accepts it.
