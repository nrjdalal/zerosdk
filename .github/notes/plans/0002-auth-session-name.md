# The sign-in session table and the glossary's Session

- Status: icebox
- Links: PR #20 (raised in its review)

## Concern

One word, two meanings. The database's `session` table (`packages/db/src/schema/auth.ts`, generated from Better Auth by `bun run auth:schema`) holds a human's sign-in. The glossary, since PR #20, defines a Session as one agent's working context, from its start until it stops, and [ADR 0004](../../docs/adr/0004-threads-not-sessions.md) names each new thing the human asks, with the updates added to it, a thread, not a session, to keep that meaning clear.

## Context

Nothing stores an agent's session yet, so today the clash is only in reading: a `session` in the auth code is a sign-in, and a session in the docs is an agent's context. It starts to matter when agent sessions get a table or a type of their own, beside the sign-in one.

## Open question

What to do when agent sessions need storage, if anything. Undecided: rename the sign-in table, give the agent's table a qualified name, or keep both names and say which one is meant where they meet.
