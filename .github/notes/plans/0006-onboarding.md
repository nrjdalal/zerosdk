# Onboarding

- Status: in progress, parked on 2026-10-21 (the mockup is built and pushed, nothing merged)
- Links: branch `feat/onboarding` · [the harness and bridge plan](0004-harness-bridge.md) · [the local data plan](0005-local-data.md) · [AskUserQuestion](0007-ask-user-question.md)

Onboarding is the setup ZeroSDK runs the first time: it checks what the factory needs on the human's machine and fixes what is missing, one step at a time. The mockup is at `/docs/ui/onboarding`, running on a pretend machine.

## Decided

1. **It asks nothing** (2026-10-21). AgentZero's model and effort are derived, the permission flipper is set in the running app, and the fallback agent is not part of it.
2. **Seven steps, in this order** (2026-10-21): the zerosdk CLI and skill, Docker, Postgres, herdr, Claude Code, herdr's Claude hook, repo trust. Claude Code's sign-in comes after herdr, and herdr's Claude hook after Claude Code, whose settings it writes.
3. **ZeroSDK is installed up front** (2026-10-21) with `npx zerosdk`, which puts the `zerosdk` command and its skill on the machine, so the first step is done when onboarding opens. A curl script and a compiled binary can come later.
4. **Onboarding installs Docker** (2026-10-21) when it is missing, then starts it.
5. **A button per step, plus Set up everything** (2026-10-21), which becomes Continue once every step is done. Nothing changes the machine until the human clicks.
6. **Each step is a `Trace` line with a full-width button under it** (2026-10-21), from shadcn's `Trace`. The line holds the step's name and, once done, what its check found at its right end, such as a version. The button stays and names the fix in the step's tense: Install, Installing, Installed. Only one fix runs at a time.
7. **The demo simulates a run** (2026-10-21) from a jotai atom: each fix runs for a moment, then succeeds.

## Built (the mockup)

- `web/next/src/components/onboarding/onboarding.tsx`: `Onboarding`, `OnboardingStep` and `OnboardingStatus`.
- `web/next/src/components/onboarding/onboarding-demo.tsx`: the seven steps and the simulated run.
- `web/next/src/components/ui/trace.tsx`: added with the shadcn CLI.
- `/docs/ui/onboarding`, the glossary's Onboarding, and the Trace section of the design skill's `shadcn.md`.
- `tests/web/next/src/components/onboarding/onboarding.test.ts`.

## Left

- **Real checks and fixes** behind the server's setup route, through each bridge's and harness's `check()` (plan 0004), and how each fix installs per platform (Docker, herdr, Claude Code).
- **Failures with a way out**: what a failed fix says and how the human retries it.
- **Claude Code's sign-in**, which needs the human in the browser.
- **The bridge choice** of plan 0004's decision 5, once cmux exists; with herdr alone there is nothing to choose.
- **The review loop and a PR**, when the user picks this up again.
