import * as z from "zod"

/** A Tailwind color; drawn at shade 600 in light mode and 500 in dark mode, e.g. violet */
export const Color = z.enum([
  "amber",
  "blue",
  "cyan",
  "emerald",
  "fuchsia",
  "gray",
  "green",
  "indigo",
  "lime",
  "mauve",
  "mist",
  "neutral",
  "olive",
  "orange",
  "pink",
  "purple",
  "red",
  "rose",
  "sky",
  "slate",
  "stone",
  "taupe",
  "teal",
  "violet",
  "yellow",
  "zinc",
])

/** Reasoning effort level, from low to max; the levels available depend on the model, e.g. high */
export const Effort = z.enum(["low", "medium", "high", "xhigh", "max"])

/** Where persistent memory lives; local is this project only and kept out of version control, project is shared through the repo, user spans every project, e.g. project */
export const Memory = z.enum(["local", "project", "user"])

/** Place of an agent in the team; a main agent sits at the top, above the orchestrators, an orchestrator owns one area of the work and splits it into tasks for subagents, and a subagent is started for one task and ends when it is done, e.g. orchestrator */
export const Role = z.enum(["main", "orchestrator", "subagent"])
