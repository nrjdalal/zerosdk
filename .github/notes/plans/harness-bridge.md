# Run agents through a harness and a bridge

- Status: planned
- Links: [research](../../docs/research/harness-bridge-261020.md) · [the Session schema plan](session-schema.md)

ZeroSDK runs each agent as its own Claude Code session. The app runs on the user's machine: the UI calls the server, the server starts and talks to sessions through a bridge, and the sessions message each other as Claude Code peers.

```
now:    UI ─► server ─► Harness ─► claude-code (cli) ─► Bridge ─► herdr ─► `claude` in a pane
later:  UI ─► server ─► Harness ─► claude-code (sdk) ─► @anthropic-ai/claude-agent-sdk
```

## Decided

1. **The app runs locally** (2026-10-20). A hosted server cannot reach herdr or start `claude` on the user's machine; zerosdk.dev stays the docs site.
2. **The flow is UI, server, bridge, CLI** (2026-10-20). Both the UI and the agents open new sessions through the server, which records who opened each one, since herdr keeps no parent.
3. **Agents talk as Claude Code peers** (2026-10-20), through cross-session messaging. Every session gets a unique name and `crossSessionInbound: "accept"`.
4. **CLIs first, no SDK and no ACP yet** (2026-10-20). The SDK route comes later as a second implementation of the same harness contract.
5. **The bridge is herdr first, cmux later** (2026-10-20), behind one bridge contract, chosen by one setting.
6. **Hooks and the screen, both from the start** (2026-10-20). Claude Code hooks passed at launch through `--settings` post events to the local server and are the main signal; the screen read through herdr is the backup, since Escape fires no hook.

## Steps

1. Write the harness and bridge contracts from section 10 of the research, with the bridge's herdr implementation and the harness's Claude Code CLI implementation.
2. Add the server routes that open a session, send a message, answer a prompt, interrupt, stop, and list sessions with their status, and the hook endpoints Claude Code posts to.
3. Store each session's Claude UUID and full launch settings beside its ZeroSDK id, so a resume can pass them again.
4. Compute the nine statuses in the harness from hook events, herdr's status and pattern events, and a no-progress timer.
5. Keep the screen strings Claude Code prints (prompts, usage limits) in the Claude Code harness, with real screen captures as test fixtures.
6. Verify the whole flow on a real machine with herdr: open a session, send, answer, hit a prompt, interrupt, resume after a restart.

## Open questions

To ask the user one at a time, each with a recommendation:

1. **How prompts get answered.** Recommended: through the hook reply (`PermissionRequest`, and `PreToolUse` for questions), with keys typed through the bridge as the fallback, so typed keys never land in the wrong box.
2. **The permission mode agents run in.** Recommended: to be settled with the agent roles, since it decides which prompts appear and how peer messages are held.
3. **First launch in a new worktree.** Recommended: pre-seed the workspace trust dialog, so a session never starts behind it.
