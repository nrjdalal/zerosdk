# Memory and skills live in the database, behind a CLI

Agents read and write memory and skills through a `zerosdk` CLI that calls the local server, so the database is the one copy and the UI can show every memory and skill. Claude Code's own memory is off (`autoMemoryEnabled: false` in the launch settings; when disabled, "Claude does not create or load auto memory files", [Claude Code](https://code.claude.com/docs/en/env-vars)). Claude Code loads native skills only from files, so the server writes each agent's own skills into its session's `.claude/skills/` at launch, one way, and a permission rule blocks direct writes there, keeping the files from drifting.

This departs from the sources: eight of the nine keep skills as `SKILL.md` folders, and every CLI-shaped source keeps memory as files ([research](../research/local-data-261020.md)). A CLI rather than an MCP server because the factory must spend few tokens: CLIs "are still more context-efficient than MCP servers because they don't add any per-tool listing" ([Claude Code](https://code.claude.com/docs/en/costs)), and the one skill that teaches the commands keeps only its description in context until used.

## Considered Options

- **Files as the source of truth**, indexed by the server: Claude would keep writing memory and skills behind the server's back, and the UI would show a copy.
- **An MCP server**: every tool's schema in context on every turn.
