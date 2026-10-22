# Decisions

One architecture decision record per hard-to-reverse choice, in the order they were made. The `domain-modeling` skill's [ADR format](../../../.agents/skills/domain-modeling/ADR-FORMAT.md) says when one is worth writing.

- [0001 Names follow the sources](0001-names-follow-the-sources.md)
- [0002 Agent roles are main, orchestrator and subagent](0002-agent-roles-main-orchestrator-subagent.md)
- [0003 A fallback is another agent, not a list of models](0003-fallback-is-a-separate-agent.md)
- [0004 The human's threads are not sessions](0004-threads-not-sessions.md)
- [0005 Agents run in CLI harnesses through a bridge](0005-agents-run-in-cli-harnesses-through-a-bridge.md)
- [0006 The server answers permission requests](0006-the-server-answers-permission-requests.md)
- [0007 One local Postgres, and no sync engine yet](0007-one-local-postgres-and-no-sync-engine-yet.md)
- [0008 Memory and skills live in the database, behind a CLI](0008-memory-and-skills-live-in-the-database-behind-a-cli.md)
- [0009 An agent is built around Claude, and known by a UUID](0009-an-agent-is-built-around-claude-and-known-by-a-uuid.md)
- [0010 A session keeps what most sources keep, and its labels in metadata](0010-a-session-keeps-what-most-sources-keep.md)
- [0011 A session's messages are stored whole, and threads group them](0011-a-session-s-messages-are-stored-whole-and-threads-group-them.md)
- [0012 Each Claude account signs in its own config directory, and the factory stores no token](0012-each-claude-account-signs-in-its-own-config-directory.md)
