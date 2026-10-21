"use client"

import { atom, useAtom } from "jotai"

import { Onboarding, type OnboardingStatus } from "@/components/onboarding/onboarding"
import { toast } from "@/components/ui/toast"

// Each step's name, its button in every status, and what its check found once done
const steps = [
  {
    actions: { done: "Installed", error: "Install", pending: "Install", running: "Installing" },
    description: "0.1.0",
    id: "zerosdk",
    title: "zerosdk CLI and skill",
  },
  {
    actions: { done: "Installed", error: "Install", pending: "Install", running: "Installing" },
    description: "29.0.1",
    id: "docker",
    title: "Docker",
  },
  {
    actions: { done: "Started", error: "Start", pending: "Start", running: "Starting" },
    description: "localhost:5432",
    id: "postgres",
    title: "Postgres",
  },
  {
    actions: { done: "Installed", error: "Install", pending: "Install", running: "Installing" },
    description: "0.9.5",
    id: "herdr",
    title: "herdr",
  },
  {
    actions: { done: "Signed in", error: "Sign in", pending: "Sign in", running: "Signing in" },
    description: "2.1.304",
    id: "claude-code",
    title: "Claude Code",
  },
  {
    actions: { done: "Added", error: "Add", pending: "Add", running: "Adding" },
    id: "herdr-hook",
    title: "herdr's Claude hook",
  },
  {
    actions: { done: "Trusted", error: "Trust", pending: "Trust", running: "Trusting" },
    id: "trust",
    title: "Repo trust",
  },
] as const

type StepId = (typeof steps)[number]["id"]

// The demo's machine: zerosdk installed up front, no Docker, and Claude Code signed out
const statusesAtom = atom<Record<StepId, OnboardingStatus>>({
  "claude-code": "error",
  docker: "pending",
  "herdr-hook": "pending",
  herdr: "pending",
  postgres: "pending",
  trust: "pending",
  zerosdk: "done",
})

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export function OnboardingDemo() {
  const [statuses, setStatuses] = useAtom(statusesAtom)

  const fix = async (id: StepId) => {
    setStatuses((current) => ({ ...current, [id]: "running" }))
    await wait(1200)
    setStatuses((current) => ({ ...current, [id]: "done" }))
  }

  const fixAll = async () => {
    for (const step of steps) if (statuses[step.id] !== "done") await fix(step.id)
  }

  return (
    <Onboarding
      steps={steps.map((step) => ({
        action: step.actions[statuses[step.id]],
        description:
          statuses[step.id] === "done" && "description" in step ? step.description : undefined,
        id: step.id,
        status: statuses[step.id],
        title: step.title,
      }))}
      onContinue={() => toast.add({ title: "Onboarding done", type: "success" })}
      onFix={(id) => fix(id as StepId)}
      onFixAll={fixAll}
    />
  )
}
