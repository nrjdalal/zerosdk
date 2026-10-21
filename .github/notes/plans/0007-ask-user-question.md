# AskUserQuestion

- Status: parked on 2026-10-21 (built on its own branch, nothing merged)
- Links: branch `feat/ask-user-question` · [Claude's user input docs](https://code.claude.com/docs/en/agent-sdk/user-input) · [onboarding](0006-onboarding.md)

How an agent's question reaches the human, mirroring Claude's `AskUserQuestion` tool field for field: one to four questions, each with a `question`, a `header`, two to four `options` (a `label`, a `description` and an optional `preview`) and `multiSelect`, answered as `answers` keyed by question text, several answers joined by commas, and an "Other" answer in the human's own words.

## Built

`/docs/ui/ask-user-question`, shadcn's primary Questionnaire demo as it stands: the question as the title, each option's label and description, checkboxes for `multiSelect`, the free-text field for Other, and letter shortcuts. The user liked this default.

## Left

- **`header`**, Claude's chip of up to 12 characters, which the default has no place for; one option is chips in place of "Question 1 of 2", as Claude Code shows them.
- **Which agent is asking**, as several agents run at once.
- **`preview`**, the mockup an option can carry.
- **Docs, tests, the review loop and a PR.**
