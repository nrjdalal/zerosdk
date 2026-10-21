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
A conversation the human returns to and is kept updated on, held with AgentZero or a fallback agent standing in for it; it holds turns and outlives any one agent's session.
_Avoid_: chat, conversation, session

**Turn**:
One message from the human and all the work it starts, delegated work included; not a single model step.

**Session**:
One agent's working context, from its start until it stops; a thread can outlast several of AgentZero's sessions.

## Execution

**Harness**:
The program that runs one agent's loop of model calls and tools, such as Claude Code or OpenCode; the model inside it comes from a provider of its own.
_Avoid_: engine, runner, runtime

**Bridge**:
The program that hosts harnesses in terminal panes the factory can open, type into and read, such as herdr or cmux.
_Avoid_: host, multiplexer, terminal, workspace

**Permission flipper**:
A main agent's setting for how the factory answers permission requests from it and every agent under it: ask the human, follow saved rules, or allow all.
_Avoid_: permission mode

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
