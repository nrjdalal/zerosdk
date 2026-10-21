# How agent frameworks model one run of an agent: sessions, runs and threads in nine TypeScript sources (2026)

Research date: 2026-10-20. Gathered by three research subagents from each source's published TypeScript types (the npm `latest` release that day, read as text and never run) and its docs (cached that day), plus the Codex app-server schema at git tag `rust-v0.163.0`. It feeds the Session schema behind ZeroSDK's agents sidebar, where each row is one agent's run.

Labels: [Docs] official documentation · [Types] a published `.d.ts` · [Schema] a generated protocol schema · [Undocumented] in the types, absent from the docs · [Example] built from documented fields, not a captured output.

| Source            | Read from                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| Anomaly OpenCode  | `@opencode/schema@2.0.32` and `@opencode/sdk@2.0.32` (V2), https://opencode.ai/v2/docs/                   |
| Claude Agent SDK  | `@anthropic-ai/claude-agent-sdk@0.3.304`, https://code.claude.com/docs/en/agent-sdk/overview              |
| Claude Code       | docs only, as it exports no types: https://code.claude.com/docs/en/overview                               |
| Cloudflare Agents | `agents@0.28.1`, https://developers.cloudflare.com/agents/                                                |
| Mastra            | `@mastra/core@1.78.0`, https://mastra.ai/docs                                                             |
| OpenAI Agents SDK | `@openai/agents-core@0.20.0`, https://openai.github.io/openai-agents-js/                                  |
| OpenAI Codex      | `@openai/codex-sdk@0.163.0` and the app-server schema at `rust-v0.163.0`, https://learn.chatgpt.com/docs/ |
| Vercel AI SDK     | `ai@7.0.146`, https://ai-sdk.dev/docs                                                                     |
| Vercel eve        | `eve@0.81.1`, https://eve.dev/docs                                                                        |

ZeroSDK's glossary terms, used throughout: a **Session** is one agent's working context, from its start until it stops; a **Thread** is a conversation the human returns to, which holds turns and outlives any one session (since 2026-10-21 the glossary defines it as a main message picked out of the human's conversation with AgentZero, which belongs to no session); a **Turn** is one message from the human and all the work it starts, delegated work included.

## Contents

1. [What each source calls one run](#1-what-each-source-calls-one-run)
2. [The fields of one run](#2-the-fields-of-one-run)
   - [Identifier](#identifier) · [Agent](#agent) · [Parent](#parent) · [Status field](#status-field) · [Task kind](#task-kind) · [Title](#title)
3. [Status values](#3-status-values)
   - [Against ZeroSDK's nine statuses](#against-zerosdks-nine-statuses) · [Values ZeroSDK lacks](#values-zerosdk-lacks) · [Labels in product UIs](#labels-in-product-uis)
4. [Demos](#4-demos)
   - [Every kind Claude Code shows](#every-kind-claude-code-shows): [Agent view rows](#agent-view-rows-claude-code) · [Sessions as JSON](#sessions-as-json-claude-code)
   - [Kinds Claude Code lacks](#kinds-claude-code-lacks): [A new id for each run of a resumed subagent](#a-new-id-for-each-run-of-a-resumed-subagent-claude-agent-sdk) · [A subagent run that is a session of its own](#a-subagent-run-that-is-a-session-of-its-own-opencode) · [A status stored on the run's record](#a-status-stored-on-the-runs-record-codex) · [A pointer to the root as well as the parent](#a-pointer-to-the-root-as-well-as-the-parent-eve) · [Why a run is stuck](#why-a-run-is-stuck-cloudflare)
5. [What it means for ZeroSDK's Session](#5-what-it-means-for-zerosdks-session)

---

## 1. What each source calls one run

| Source            | One agent's run (ZeroSDK Session)                                                                                 | The conversation (ZeroSDK Thread)                                          | Turn                                                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Anomaly OpenCode  | A session; a subagent runs in a child session, a `Session.Info` with `parentID` [Types]                           | A root session                                                             | From a prompt to the next idle marker, prompts steered in meanwhile included [Types]                                |
| Claude Agent SDK  | A subagent is a task (`task_id`) and each of its runs has a `run_id`; the main agent's run is the session [Types] | The session (`session_id`)                                                 | One prompt through to its result message [Types]; the agent-loop page uses the word for one model round trip [Docs] |
| Claude Code       | The session for the main agent; a subagent (`agent_id`) runs inside it [Docs]                                     | The session                                                                | "One complete response from Claude within a session" [Docs]                                                         |
| Cloudflare Agents | An agent-tool run (`runId`) [Types]                                                                               | A session, "a conversation made up of one or more turns" [Docs]            | "One request to an agent and its response" [Docs]                                                                   |
| Mastra            | No stored record, only a `runId`; its AgentController `Session` is live state for one user, not one agent [Docs]  | A thread (`StorageThreadType`) [Types]                                     | One `agent.generate()` call [Docs]                                                                                  |
| OpenAI Agents SDK | A nested run, started by `Agent.asTool()`, with no id of its own [Types]                                          | A `Session`, which it calls conversation memory [Types]                    | One `run()` call [Docs]; `TurnSpan` uses the word for one loop iteration [Types]                                    |
| OpenAI Codex      | An agent thread, a `Thread` with `parentThreadId` [Schema]                                                        | A root thread                                                              | A `Turn`; the turns of delegated work share one `rootTurnId` [Schema]                                               |
| Vercel AI SDK     | None: one `generate()` or `stream()` call, identified by `callId` [Types]                                         | A client `Chat` with an `id` [Types]                                       | A user message and the assistant message that answers it                                                            |
| Vercel eve        | A session; each subagent call opens a child session [Docs]                                                        | The root session, or the platform conversation a channel maps to it [Docs] | "One user message and all the work it triggers" [Docs]                                                              |

"Session" names one agent's run in OpenCode, Claude Code and eve, and the conversation in Cloudflare and the OpenAI Agents SDK. Codex reuses "thread" for both, and Claude Code's Projects call each session they start a thread [Docs], the opposite of ZeroSDK's use.

## 2. The fields of one run

| Source            | Record                                  | Identifier               | Agent                                | Parent                                                       | Status field                                        | Title                                    |
| ----------------- | --------------------------------------- | ------------------------ | ------------------------------------ | ------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------- |
| Anomaly OpenCode  | `Session.Info`                          | `id`                     | `agent`, the agent's id              | `parentID`                                                   | none stored: `outcome` and a `session.status` event | `title`                                  |
| Claude Agent SDK  | task events                             | `task_id`, `run_id`      | `subagent_type`, a name              | `parent_task_id`, plus `spawn_depth`                         | `status` on the task                                | `description`; `summary` for the session |
| Claude Code       | session, subagent                       | `session_id`, `agent_id` | `agent_type`, a name                 | `parent_agent_id` (telemetry), `parent_tool_use_id` (stream) | `state`, plus `status` for the process              | `name`, plus a row summary               |
| Cloudflare Agents | `AgentToolRunState`                     | `runId`                  | `agentType`, a class name            | `parentToolCallId`                                           | `status`                                            | none: `summary` and `display.name`       |
| Mastra            | none stored; live `ActiveSubagentState` | `runId`                  | `agentType`, a name                  | the parent's tool call, as the map key                       | `status`, live only                                 | none on a run; `title` on a thread       |
| OpenAI Agents SDK | `RunState`                              | none; `traceId`          | `currentAgent.name`                  | a span's `parentId`                                          | none                                                | `workflowName`, set in code              |
| OpenAI Codex      | `Thread`                                | `id`                     | `agentRole`, a name                  | `parentThreadId`, plus `depth` in `source`                   | `status`                                            | `name`                                   |
| Vercel AI SDK     | none                                    | `callId`                 | the tool's name                      | none: the child nests in the parent's message                | none on a run                                       | none                                     |
| Vercel eve        | session                                 | `sessionId`              | `invocation.name`; `runtime.agentId` | `parent.sessionId`, plus `parent.rootSessionId`              | none stored: lifecycle events                       | none public; generated internally        |

### Identifier

Where the run is a record of its own, the key is `id` (OpenCode, Codex). The others name it for the record: `task_id` and `run_id` (Claude Agent SDK), `runId` (Cloudflare, Mastra), `sessionId` (eve). Formats differ: a prefix (`ses_` in OpenCode), a UUID (Claude, UUIDv7 in Codex), or opaque. Claude Agent SDK alone keeps one id for the task and a new one for each run of it, since a resumed subagent keeps its `task_id`.

### Agent

Seven sources name the agent by its name: Claude Agent SDK, Claude Code, Cloudflare, Mastra, the OpenAI Agents SDK, Codex and eve. OpenCode stores the agent's id, eve adds a `runtime.agentId`, and the AI SDK names only the tool that runs the agent. Five spell the field as an agent type: `subagent_type`, `agent_type`, `agentType` in Cloudflare and Mastra, and Codex's `agentRole`, whose Rust source accepts `agent_type` as an alias.

### Parent

Six sources point a subagent's run at the run that started it: OpenCode `parentID`, Claude Agent SDK `parent_task_id`, Claude Code `parent_agent_id`, Mastra `parentSessionId` [Undocumented], Codex `parentThreadId` and eve `parent.sessionId`. Claude's stream and Cloudflare point at the tool call instead (`parent_tool_use_id`, `parentToolCallId`), the OpenAI Agents SDK links only spans, and the AI SDK nests the child inside the parent's message. Four also record the depth: OpenCode, Claude Agent SDK, Mastra [Undocumented] and Codex. eve alone stores the root as well; Codex reaches it through `sessionId`, which is the root thread's id. OpenCode and Codex keep a fork's origin in a field apart from the parent.

### Status field

Seven sources call the field `status`: OpenCode, Claude Agent SDK, Claude Code's subagent rows, Cloudflare, Mastra, Codex and eve. `state` appears in Claude Agent SDK's `session_state_changed` event, in Claude Code's `claude agents --json` and in Cloudflare's task runs. OpenCode and eve keep it only in lifecycle events, and the OpenAI Agents SDK and AI SDK have none on a run.

### Task kind

None of the nine has a field for the kind of work a run does. Each keeps the task as free text: `description` and `prompt` (OpenCode, Claude Agent SDK), `description` (Claude Code), `input` (Cloudflare), `task` (Mastra), `prompt` (Codex), `message` (eve). Their `type` and `kind` fields name the mechanism instead: monitor, shell, subagent, workflow. The nearest classifier is the agent itself, as in OpenCode's agents `build`, `explore`, `general` and `plan`, Mastra's example subagent ids "explore", "plan" and "execute", and Codex's built-in roles `default`, `explorer` and `worker`.

### Title

Four sources generate the title: OpenCode with a hidden `title` agent, Claude Code with a Haiku-class model from the first prompt, Mastra with `generateTitle` from the first user message (threads only), and eve from the first user message (internal only). Five let the user rename it: OpenCode, Claude Agent SDK, Claude Code, Mastra and Codex. The field is `title` (OpenCode, Mastra, eve), `name` (Claude Code, Codex) or `summary` (Claude Agent SDK, Cloudflare). Three also keep a one-line live summary for the row, apart from the title: Claude Agent SDK's `task_progress.summary`, Claude Code's row summary and Cloudflare's `progress.message`. Claude Code's agent view shows a pull request label (`#2048`) beside the title rather than inside it, and its status line data carries `pr.number`, `pr.review_state` and `pr.url` [Docs].

## 3. Status values

### Against ZeroSDK's nine statuses

Each cell is the source's own value for that meaning; a dash means none was found. The last column counts the sources that have the meaning, and in brackets those that use ZeroSDK's word for it.

| ZeroSDK   | OpenCode          | Claude Agent SDK        | Claude Code                        | Cloudflare                          | Mastra                      | OpenAI Agents SDK     | Codex                                                     | AI SDK               | eve                               | Sources |
| --------- | ----------------- | ----------------------- | ---------------------------------- | ----------------------------------- | --------------------------- | --------------------- | --------------------------------------------------------- | -------------------- | --------------------------------- | ------- |
| pending   | -                 | `pending`               | -                                  | `starting`; tasks `pending`         | `pending`                   | -                     | `pendingInit`                                             | `submitted`          | `submitted`                       | 6 (3)   |
| running   | `busy`, `running` | `running`               | `working`; subagent rows `running` | `running`                           | `running`                   | `next_step_run_again` | `active`, `running`                                       | `streaming`          | `active`, `working`               | 9 (6)   |
| waiting   | -                 | `requires_action`       | `blocked`; process `waiting`       | turns `awaiting-input`              | `suspended`                 | an interruption       | `active` with `waitingOnApproval` or `waitingOnUserInput` | `approval-requested` | turns `waiting` on `input`        | 8 (2)   |
| idle      | `idle`            | `idle`                  | `idle`                             | `busy: false`                       | `isRunning: false`          | -                     | `idle`                                                    | `ready`              | `session.waiting` (parked)        | 8 (4)   |
| paused    | -                 | `paused` [Undocumented] | -                                  | workflows `paused`                  | `paused` (step debugging)   | -                     | goal `paused`                                             | -                    | -                                 | 4 (4)   |
| stuck     | -                 | -                       | -                                  | `interrupted`, reason `no-progress` | prose: "stuck in `running`" | -                     | goal `blocked` [Undocumented]                             | -                    | "stranded", an error not a status | 0 (0)   |
| completed | `succeeded`       | `completed`             | `done`; subagent rows `completed`  | `completed`                         | `completed`, `success`      | final output          | `completed`                                               | `completed`          | `completed`                       | 9 (7)   |
| failed    | `failed`          | `failed`                | `failed`                           | `error`; tasks `failed`             | `error`, `failed`           | a thrown error        | `errored`, `failed`, `systemError`                        | `error`, `failed`    | `failed`                          | 9 (8)   |
| cancelled | `interrupted`     | `killed`, `stopped`     | `stopped`; subagent rows `killed`  | `aborted`; tasks `cancelled`        | `canceled`, `cancelled`     | `cancelled` (a flag)  | `interrupted`                                             | `aborted`            | `cancelled`                       | 9 (4)   |

`stuck` counts no source because none stores it as a value; the cells show the nearest thing each has. OpenCode shows waiting on the human only indirectly, through its pending permission requests. Cloudflare's tasks and Mastra's workflows use `waiting` for a timer or a sleep, not for a person, and two of the four `paused` values sit on a workflow or a goal rather than a run.

### Values ZeroSDK lacks

- `interrupted` ends a run that no person stopped: a restart, a deploy or a newer run superseding it (OpenCode, Cloudflare, Codex).
- `notLoaded` marks a thread that exists but is not in memory (Codex).
- `retry` marks a model call being retried while the run goes on (OpenCode's status event).
- `timed_out` (Mastra background tasks) and `tripwire`, a guardrail stop (Mastra workflows).

### Labels in product UIs

Claude Code's agent view shows Working, Needs input, Idle, Completed, Failed and Stopped, and groups rows as Ready for review, Needs input, Working and Completed. Codex's activity tray shows Running, Needs input, Ready and Blocked. Both label waiting on the human "Needs input".

## 4. Demos

### Every kind Claude Code shows

#### Agent view rows (Claude Code)

[Docs] https://code.claude.com/docs/en/agent-view: each row is a status icon, the session's name, its one-line summary, an optional pull request label and its age, grouped so the rows that need the human come first.

```text
Pinned
  ✽ clawd walk cycle          Drawing the walk-cycle sprite frames          3m

Ready for review
  ∙ jump physics              Opened PR with collision fix                 #2048  2h

Needs input
  ✻ power-up design           double jump or wall climb?                    1m

Working
  ✽ collision detection       Adding swept-AABB checks to CollisionSystem   2m
  ✢ playtest level 3          all checkpoints cleared ×12                in 4m

Completed
  ✻ title screen              menu, options, and credits done               9m
  ∙ sound effects             14 SFX exported to assets/audio               4h
  … 6 more
```

#### Sessions as JSON (Claude Code)

[Example] one entry of `claude agents --json`, built from the documented fields at https://code.claude.com/docs/en/agent-view#list-sessions-as-json, for a background session waiting on an answer:

```json
[
  {
    "cwd": "/Users/me/game",
    "kind": "background",
    "startedAt": 1792488600000,
    "id": "7c5dcf5d",
    "state": "blocked",
    "pid": 48213,
    "status": "waiting",
    "waitingFor": "input needed",
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "name": "power-up design"
  }
]
```

### Kinds Claude Code lacks

#### A new id for each run of a resumed subagent (Claude Agent SDK)

Claude Code names a subagent by one `agent_id` across all its runs. The Agent SDK's task events also give each run its own `run_id`. [Docs] https://code.claude.com/docs/en/agent-sdk/typescript#sdktaskstartedmessage: a background subagent that Claude resumed once. Both runs share the `task_id`; each has its own `run_id`.

```json
{"subtype": "task_started", "task_id": "a5c2e8f41b09d7a36", "run_id": "0mubbs7i8-6f0c2d41"}
{"subtype": "task_notification", "task_id": "a5c2e8f41b09d7a36", "run_id": "0mubbs7i8-6f0c2d41", "status": "completed"}
{"subtype": "task_started", "task_id": "a5c2e8f41b09d7a36", "run_id": "0mubc18m1-b7719e05"}
```

#### A subagent run that is a session of its own (OpenCode)

Claude Code keeps a subagent inside the session that spawned it, and its agent view lists no subagent rows. OpenCode makes it a child session with its own id, parent, depth and title. [Docs] https://opencode.ai/v2/docs/cli/acp/, an update a child session sends on its parent's prompt:

```json
{
  "sessionUpdate": "tool_call",
  "toolCallId": "ses_child:call_1",
  "title": "Explore the codebase: src/app.ts",
  "_meta": {
    "opencode/child-session": {
      "id": "ses_child",
      "parentID": "ses_123",
      "depth": 1,
      "title": "Explore the codebase"
    }
  }
}
```

#### A status stored on the run's record (Codex)

Claude Code reports status per listing and per event. Codex stores it on the thread, and says why an active thread waits. [Schema] `codex-rs/app-server-protocol/schema/typescript/v2/` at `rust-v0.163.0`, trimmed to the row's fields and reformatted:

```ts
export type Thread = {
  /** Identifier for this thread. Codex-generated thread IDs are UUIDv7. */
  id: string
  /** The ID of the parent thread. This will only be set if this thread is a subagent. */
  parentThreadId: string | null
  /** Current runtime status for the thread. */
  status: ThreadStatus
  /** Optional role (agent_role) assigned to an AgentControl-spawned sub-agent. */
  agentRole: string | null
  /** Optional user-facing thread title. */
  name: string | null
}

export type ThreadStatus =
  | { type: "notLoaded" }
  | { type: "idle" }
  | { type: "systemError" }
  | { type: "active"; activeFlags: Array<ThreadActiveFlag> }

export type ThreadActiveFlag = "waitingOnApproval" | "waitingOnUserInput"
```

#### A pointer to the root as well as the parent (eve)

Claude Agent SDK's `parent_task_id` names only the immediate parent. eve also stores the top of the chain on every child. [Types] `eve/dist/src/channel/types.d.ts`, comment trimmed:

```ts
/**
 * Lineage metadata for the eve parent execution that delegated this session.
 *
 * `sessionId` and `turn` describe the **immediate** parent that dispatched
 * this child. `rootSessionId` denormalizes the top of the dispatch chain so
 * descendants identify the user-facing session without walking up
 * parent-by-parent.
 */
export interface SessionParent {
  /** Parent runtime-action tool call id that created this child session. */
  readonly callId: string
  readonly rootSessionId: string
  readonly sessionId: string
  readonly turn: SessionTurn
}
```

#### Why a run is stuck (Cloudflare)

Claude Code has no value for a run that stopped making progress. Cloudflare ends such a run as `interrupted` and records why. [Types] `agents/dist/agent-routing-*.d.ts`, comment trimmed to the no-progress case and its dash written as a colon:

```ts
type AgentToolRunStatus = "starting" | "running" | "completed" | "error" | "aborted" | "interrupted"

/**
 * - `no-progress`: the child went silent for a full no-progress window while
 *   the parent was tailing it (genuinely stalled / hung).
 */
type AgentToolInterruptedReason =
  | "no-progress"
  | "window-exceeded"
  | "not-tailable"
  | "inspect-timeout"
  | "inspect-failed"
  | "recovery-deadline"
  | "budget-exceeded"
```

## 5. What it means for ZeroSDK's Session

ZeroSDK's sidebar today keeps a row's `state`, task kind, title and nesting in the web app only. Following the sources, they belong to a Session record beside the Agent, with a subagent's run as a child session, as in OpenCode, Codex and eve. [Example] a draft for discussion, with keys A to Z as ZeroSDK orders them:

```ts
export const Session = z.object({
  agent: Id,
  id: Id,
  parent: Id.optional(),
  status: z.enum(["cancelled", "completed", "failed", "idle", "running", "waiting"]),
  title: z.string().optional(),
})
```

The decisions it leaves open:

1. **The field's name.** `status`, as seven sources call it, or the UI's current `state`.
2. **The values.** The draft keeps the six that eight or nine sources have: cancelled, completed, failed, idle, running and waiting. `pending` is in six and `paused` in four. `stuck` is in none: Cloudflare and Mastra detect it from a run that stopped making progress, so it reads as a condition the UI finds rather than a value a run is stored in.
3. **Task kind.** No source has one. It can go, come from the agent (as OpenCode's and Mastra's agent ids and Codex's roles do), or stay as ZeroSDK's own field.
4. **The agent reference.** By Id, as OpenCode does and as ZeroSDK's own `fallbacks: z.array(Id)` does, or by name, as the other seven do.
5. **Lineage.** The parent alone, or with the depth (four sources) or the root (eve).
6. **The title.** Generated and renamable, as most sources with a title make it, with the pull request in a field of its own beside it, as Claude Code shows it.
