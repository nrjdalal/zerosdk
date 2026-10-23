# ZeroSDK

A multi-agent software factory: the human talks to a main agent, and a team of agents builds the software.

## Agents

**Agent**:
A language model given one kind of work in the factory.

**Role**:
An agent's place in the team: main agent, orchestrator or subagent.

**Main agent**:
An agent at the top of the team, above the orchestrators; there may be several.
_Avoid_: dispatcher, primary, root

**AgentZero**:
The one main agent the human chats with directly.

**Orchestrator**:
A persistent agent that owns one area of the work and splits it into tasks for subagents.
_Avoid_: coordinator, lead, manager, supervisor

**Subagent**:
An agent started for one task, which ends when the task is done.
_Avoid_: child agent, teammate, worker

**Fallback agent**:
An agent that takes over, in order, when another agent's provider is unavailable or out of quota.
_Avoid_: backup, failover

**Task**:
One piece of work given to a subagent, of one kind such as build, review or test.
_Avoid_: job

## Threads

**Thread**:
One conversation kept apart from the others in a session: the messages about one thing the human asked, in order, which can come from several agents' sessions. A session can hold many threads.
_Avoid_: chat, conversation, session

**Turn**:
One message from the human and all the work it starts, delegated work included; not a single model step.

**Session**:
One agent's working context, from its start until it stops.

**Message**:
One thing said or done in a session, by the human or an agent, stored exactly as it was written.

**Inbox**:
The view of threads with unread messages, so the human never misses an update.

## Execution

**Harness**:
The program that runs one agent's loop of model calls and tools, such as Claude Code or OpenCode; the model inside it comes from a provider of its own.
_Avoid_: engine, runner, runtime

**Bridge**:
The program that hosts harnesses in terminal panes the factory can open, type into and read, such as herdr or cmux.
_Avoid_: host, multiplexer, terminal, workspace

**Account**:
One of the human's Claude accounts, such as a work or a personal one, that the factory runs sessions under; together they form one shared pool.
_Avoid_: login, profile, seat

**Permission mode**:
The way the harness handles a tool that needs permission: ask first, accept edits, plan, let a model decide, deny unless allowed, or bypass permissions.
_Avoid_: approval mode, approval policy

**Permission flipper**:
A main agent's choice of how the factory answers permission requests from it and every agent under it: ask the human, follow saved rules, or allow all.
_Avoid_: permission mode

**Settings**:
The choices saved for the whole factory, such as its bridge, harness and theme, changed while it runs; one of them is a setting.
_Avoid_: config, preferences

**Status**:
Where a session is in its life: pending, running, waiting, idle, paused, stuck, completed, failed or cancelled.
_Avoid_: state

**Waiting**:
The status of a session that asked the human something on purpose, a question or a permission, and holds until it is answered.
_Avoid_: blocked, needs input

**Paused**:
The status of a session held until a limit lifts, such as a usage limit.
_Avoid_: rate-limited, suspended

**Stuck**:
The status of a session that is not moving and asked nothing the factory understands, so a person has to look at it.
_Avoid_: hung, stalled
