# Agent roles are main, orchestrator and subagent

An agent's role is main, orchestrator or subagent: for each place in the team, the word most of the nine sources use for an agent ([ADR 0001](0001-names-follow-the-sources.md)). A word with other senses is counted only next to agent, thread or LLM, because bare `managers?` (9/9), `leads?` (8/9) and `workers?` (9/9) also match package managers, the verb "lead" and Cloudflare Workers. Four nouns name agents in some sources and other things in others, so their matches were read and only the sources using them for an agent counted (marked \*). Sources from `bun run terms` on 2026-10-20:

| Place in the team                    | Word             | Pattern                                                     | Sources |
| ------------------------------------ | ---------------- | ----------------------------------------------------------- | ------- |
| At the top, above the orchestrators  | **main**         | `main agents?\|main threads?\|main llms?`                   | 7/9     |
|                                      | root             | `root agents?\|root threads?\|root llms?`                   | 5/9     |
|                                      | primary          | `primary agents?\|primary threads?\|primary llms?`          | 2/9     |
|                                      | dispatcher       | `dispatcher agents?\|dispatcher threads?\|dispatcher llms?` | 0/9     |
| Owns an area and delegates its tasks | **orchestrator** | `orchestrators?`                                            | 6/9\*   |
|                                      | coordinator      | `coordinators?`                                             | 5/9\*   |
|                                      | lead             | `lead agents?\|lead threads?\|lead llms?`                   | 2/9     |
|                                      | manager          | `manager agents?\|manager threads?\|manager llms?`          | 2/9     |
|                                      | supervisor       | `supervisors?`                                              | 2/9\*   |
| Does one task, then ends             | **subagent**     | `sub-?agents?`                                              | 9/9     |
|                                      | child agent      | `child agents?\|child threads?\|child llms?`                | 5/9     |
|                                      | teammate         | `teammates?`                                                | 2/9\*   |
|                                      | worker           | `worker agents?\|worker threads?\|worker llms?`             | 2/9     |

\* The pattern also matches non-agent uses, left out here: the Claude Agent SDK's container orchestrator and Codex's cloud orchestrator (8/9 in all), Codex's scan coordinator and eve's `coordinator` tool (7/9), OpenCode's and Claude Code's process supervisors (4/9), and Mastra's and Codex's human teammates (4/9).

An agent with no role is a subagent: Claude Code, Codex and eve treat every agent they define as one, and a main agent is then always marked on purpose. OpenCode defaults the other way: "When omitted on a new custom agent, it defaults to primary" ([OpenCode](https://opencode.ai/v2/docs/agents/#modes)).

## Considered Options

- **primary:** OpenCode's value for its `mode` field. The sources with failover pair "primary" with "fallback" ("When the primary is overloaded or unavailable, the session switches to the backup", [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/configuration)), so a main agent that stands in for another would read as a contradiction.
