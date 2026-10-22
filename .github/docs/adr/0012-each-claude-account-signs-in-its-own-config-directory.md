# Each Claude account signs in its own config directory, and the factory stores no token

ZeroSDK runs sessions across a shared pool of Claude accounts. Each account gets its own Claude Code configuration directory, and every session the harness starts on it passes `CLAUDE_CONFIG_DIR` pointing there. The human signs in once per account, through Claude Code's own login, and Claude Code keeps the credential where it always does: in the encrypted macOS Keychain, keyed to that directory, or in the directory's `.credentials.json` with file mode `0600` on Linux. A login still expires: Claude Code warns three days ahead and the human renews it with `/login` ([Claude Code](https://code.claude.com/docs/en/authentication#renew-an-expiring-login)). The factory's database holds no token. To read the usage of an account with no fresh reading, the factory reads that account's login from where Claude Code keeps it, at the moment of the call, and stores nothing. This is what Claude Code documents for staying signed in to several accounts at once: "give each account its own configuration directory" ([Claude Code](https://code.claude.com/docs/en/authentication#log-in-with-multiple-accounts)).

"Account" is the word Claude Code's own heading uses for this, "Log in with multiple accounts". With `bun run terms` on 2026-10-23, `accounts?`, `profiles?`, `credentials?` and `subscriptions?` each appear in all nine sources, `logins?` in 8/9 and `seats?` in 5/9: in Claude Code a profile is the `ant` CLI's, a credential is the secret an account signs in with, and a subscription is the plan it pays for. "Pool" is the user's word, used by 6/9.

## Anthropic's terms

Claude Code's legal page sets two limits this decision runs against:

- "Advertised usage limits for Pro and Max plans assume ordinary, individual usage of Claude Code and the Agent SDK" ([Claude Code](https://code.claude.com/docs/en/legal-and-compliance#acceptable-use)).
- "developers may not collect, store, or intermediate Claude.ai credentials or session tokens", and "sign-in to a Claude account must complete through Anthropic's own flow". The same page does not "prevent an end user from signing in to the unmodified Claude Code binary with their own Claude subscription" ([Claude Code](https://code.claude.com/docs/en/legal-and-compliance#authentication-and-credential-use)).

ZeroSDK is free and runs on the human's own machine: each account signs in through Claude Code's own `/login`, the harness drives the unmodified `claude` binary, and nothing is resold or routed for anyone else. Two parts still go against the page. A pool that spreads one person's automated work across several Pro or Max accounts, so that none reaches its limit, is at odds with the ordinary, individual usage those limits assume. And reading an account's login to call the usage endpoint is what the credentials rule forbids: the factory collects the credential at the moment of the call, even though it stores none. On 2026-10-23, after reading the page, the user kept the pool and chose the endpoint over reading `/usage` on screen, and accepts the risk to the accounts, as Anthropic "reserves the right to take measures to enforce these restrictions and may do so without prior notice".

## Consequences

A configuration directory holds more than the login: Claude Code keeps settings, session history, plugins and its `.claude.json` there, the per-project trust and MCP servers among them. So the repository is marked trusted once per account rather than once, and a session resumes only from the directory that holds its history.

## Considered Options

- **A one-year token per account:** `claude setup-token` mints one and `CLAUDE_CODE_OAUTH_TOKEN` passes it to a session, which keeps a single directory, but the factory would store a secret per account and replace each one yearly, and the token only covers inference.
- **An API key per account:** `ANTHROPIC_API_KEY` bills per token rather than against a Claude plan, which is what the pool exists to spread.
- **Reading `/usage` on screen for idle accounts:** Claude Code reads its own usage in a pane and the factory never touches a login, at a few seconds per account; set aside for the endpoint, which reads every account at once.
