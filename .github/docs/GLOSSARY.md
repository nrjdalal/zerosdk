# ZeroSDK

A multi-agent software factory: the human talks to a main agent, and a team of agents builds the software.

## Agents

**Agent**:
A language model given its own instructions to carry out one kind of work in the factory.

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

## Threads

**Thread**:
A conversation the human returns to and is kept updated on, held with AgentZero or a fallback agent standing in for it; it holds turns and outlives any one agent's session.
_Avoid_: chat, conversation, session

**Turn**:
One message from the human and all the work it starts, delegated work included; not a single model step.

**Session**:
One agent's working context, from its start until it stops; a thread can outlast several of AgentZero's sessions.
