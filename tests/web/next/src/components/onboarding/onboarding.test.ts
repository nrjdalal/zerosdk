import { describe, expect, test } from "bun:test"
import { join } from "node:path"

import {
  Onboarding,
  type OnboardingStep,
} from "../../../../../../web/next/src/components/onboarding/onboarding"

// react is a dependency of web/next, not of the root, so it resolves from there
const web = join(import.meta.dir, "../../../../../../web/next")
const { createElement } = await import(Bun.resolveSync("react", web))
const { renderToStaticMarkup } = await import(Bun.resolveSync("react-dom/server", web))

const step = (id: string, status: OnboardingStep["status"], title: string): OnboardingStep => ({
  action: `Fix ${id}`,
  id,
  status,
  title,
})

const render = (steps: OnboardingStep[]) =>
  renderToStaticMarkup(
    createElement(Onboarding, { onContinue() {}, onFix() {}, onFixAll() {}, steps }),
  ) as string

const line = (status: string | null, title: string) =>
  new RegExp(
    `<span data-slot="trace-line"${status ? ` data-status="${status}"` : ""}[^>]*>(?:(?!</span></span>).)*${title}`,
  )

const button = (label: string) =>
  new RegExp(`<button(?![^>]*\\sdisabled="")[^>]*>${label}</button>`)

describe("onboarding", () => {
  const steps = [
    { ...step("docker", "done", "Docker is running"), description: "29.0.1" },
    step("claude-code", "error", "Claude Code is not signed in"),
    step("herdr", "pending", "Install herdr"),
  ]
  const html = render(steps)

  test("shows each step as a line in its status, a done one with what its check found", () => {
    expect(html).toMatch(line(null, "Docker is running"))
    expect(html).toContain("29.0.1")
    expect(html).toMatch(line("error", "Claude Code is not signed in"))
    expect(html).toMatch(line("pending", "Install herdr"))
  })

  test("keeps each step's button, held once the step is done, and asks to set up everything", () => {
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Fix docker<\/button>/)
    expect(html).toMatch(button("Fix claude-code"))
    expect(html).toMatch(button("Fix herdr"))
    expect(html).toMatch(button("Set up everything"))
    expect(html).not.toContain("Continue")
  })

  test("holds every button while a fix runs, and spins its line", () => {
    const running = render([step("docker", "running", "Starting Docker"), steps[2]!])
    expect(running).toMatch(line("running", "Starting Docker"))
    expect(running).toContain('role="status"')
    expect(running).toMatch(/<button[^>]*disabled=""[^>]*>Fix herdr<\/button>/)
    expect(running).not.toMatch(button("Fix herdr"))
    expect(running).toMatch(/<button[^>]*disabled=""[^>]*>Set up everything<\/button>/)
  })

  test("offers Continue once every step is done", () => {
    const done = render([steps[0]!])
    expect(done).toMatch(button("Continue"))
    expect(done).not.toContain("Set up everything")
  })
})
