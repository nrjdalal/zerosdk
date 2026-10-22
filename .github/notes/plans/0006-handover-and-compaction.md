# A successor that takes over before the context fills

- Status: backlog
- Links: [ADR 0011](../../docs/adr/0011-a-session-s-messages-are-stored-whole-and-threads-group-them.md) · [research](../../docs/research/0004-threads-messages-and-inbox.md)

A harness compacts a session when its context fills, and the agent waits while it does. The idea is to start a successor before that point and hand the session over to it.

## The idea

1. **A threshold and a backstop.** At about 400,000 tokens the factory starts a successor for the session; at 500,000 the harness's own compaction still runs if no handover has happened. Claude Code takes the backstop as `CLAUDE_CODE_AUTO_COMPACT_WINDOW` or a subagent's `autoCompactWindow`, and reports how full the context is to a status-line command (`context_window.total_input_tokens`).
2. **The successor compacts while the agent works.** It summarizes the messages up to a `sessionSeq`, and when the agent finishes its turn, the agent writes a short handover note (what is in flight, the next step) and stops. The successor reads the summary, the messages after that `sessionSeq` and the note, and carries on in the same session.
3. **Compactions compared.** The same messages are compacted by the successor (the harness's own compaction, on a fork), by an external model, or by an orchestrator, and the results compared: their size and time first, then whether the successor redoes work or asks something it already knew.

## Needed first

- **A run record**, since a session then has two starts of its harness at once: its own id, the session, the harness, the harness's session id, the settings it started with, and when and why it stopped. Its names come from consensus research, and messages would point at it.
- **The shapes of the two messages it adds**, a compaction (its range, model, summary, size and time) and a handover (its note).
