"use client"

import {
  RiCheckboxBlankCircleFill,
  RiCheckboxCircleFill,
  RiErrorWarningFill,
  type RemixiconComponentType,
} from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Trace, TraceDescription, TraceIcon, TraceLine, TraceTitle } from "@/components/ui/trace"

// Where a step is: done, failed, running, or waiting for its fix
export type OnboardingStatus = "done" | "error" | "pending" | "running"

// One thing the factory needs on the human's machine, and its button, which names the fix in the step's tense
export type OnboardingStep = {
  action: string
  description?: string
  id: string
  status: OnboardingStatus
  title: string
}

const statusIcons: Record<Exclude<OnboardingStatus, "running">, RemixiconComponentType> = {
  done: RiCheckboxCircleFill,
  error: RiErrorWarningFill,
  pending: RiCheckboxBlankCircleFill,
}

function StatusIcon({ status }: { status: OnboardingStatus }) {
  if (status === "running") return <Spinner />
  const Icon = statusIcons[status]
  return <Icon />
}

export function Onboarding({
  onContinue,
  onFix,
  onFixAll,
  steps,
}: {
  onContinue: () => void
  onFix: (id: string) => void
  onFixAll: () => void
  steps: OnboardingStep[]
}) {
  const running = steps.some((step) => step.status === "running")
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
      <Trace>
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col gap-1.5">
            {/* A wrapper, as Trace fits any row that holds a line to its width, and this line spans it */}
            <div className="w-full">
              <TraceLine
                className="w-full"
                status={step.status === "done" ? undefined : step.status}
              >
                <TraceIcon>
                  <StatusIcon status={step.status} />
                </TraceIcon>
                <TraceTitle>{step.title}</TraceTitle>
                {step.description ? (
                  <TraceDescription className="ml-auto">{step.description}</TraceDescription>
                ) : null}
              </TraceLine>
            </div>
            <Button
              className="ml-6"
              disabled={running || step.status === "done"}
              variant="outline"
              onClick={() => onFix(step.id)}
            >
              {step.action}
            </Button>
          </div>
        ))}
      </Trace>
      {steps.every((step) => step.status === "done") ? (
        <Button className="self-end" onClick={onContinue}>
          Continue
        </Button>
      ) : (
        <Button className="self-end" disabled={running} onClick={onFixAll}>
          Set up everything
        </Button>
      )}
    </div>
  )
}
