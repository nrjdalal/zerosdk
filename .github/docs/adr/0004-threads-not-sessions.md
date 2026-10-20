# The human's conversations are threads, not sessions

The human talks only to AgentZero and keeps returning to a few conversations as the team works on them, so each one is a **thread**, made of turns, and **session** names one agent's own working context. This departs from the majority that [ADR 0001](0001-names-follow-the-sources.md) follows. Read from each source's API, the primary type for a resumable conversation is session in 5 of the 9 sources (Anomaly OpenCode, Claude Agent SDK, Claude Code, OpenAI Agents SDK, Vercel eve), thread in 2 (Mastra, OpenAI Codex), chat in 2 (Cloudflare Agents, Vercel AI SDK) and conversation in none. `bun run terms` on 2026-10-20 finds threads in 8 of the 9 (not Anomaly OpenCode) and sessions, conversations and chats in all 9, so the word counts do not decide it.

Those sessions belong to one agent: Claude Code's agent view lists its sessions as separate agents ("Manage multiple agents", [Claude Code](https://code.claude.com/docs/en/agent-view)). A ZeroSDK thread belongs to the human instead. It outlives AgentZero's session when that restarts, and a fallback agent takes it over when AgentZero's provider is out. eve keeps the same split at its edge, where a channel token addresses "whichever session currently owns a platform conversation, such as a Slack thread" ([eve](https://eve.dev/docs/concepts/sessions-runs-and-streaming)). Codex, which has the same shape of one agent and many lines of work, defines "Thread: A conversation between a user and the Codex agent. Threads contain turns", and lets you list, resume, fork, archive and pin them ([Codex](https://learn.chatgpt.com/docs/app-server)). Calling the sidebar item a session would suggest many AgentZeros.

## Considered Options

- **Session (the majority):** it would read as one agent's context, so a thread served by AgentZero and then by its fallback agent would look like two things.
- **Conversation:** none of the sources uses it as a type, only in prose and in option names such as `conversationId`.
- **Chat:** a UI word in the AI SDK and Cloudflare Agents, and AgentZero's glossary entry already uses it as the verb.
