import * as z from "zod"

import { Id } from "@/common"

/** Configuration for an agent: a language model given its own instructions to carry out one kind of work in the factory */
export const Agent = z.object({
  /** Display color for the agent in lists and transcripts; a Tailwind color, drawn at shade 600 in light mode and 500 in dark mode, e.g. violet */
  // oxfmt-ignore
  color: z.enum(["amber", "blue", "cyan", "emerald", "fuchsia", "gray", "green", "indigo", "lime", "mauve", "mist", "neutral", "olive", "orange", "pink", "purple", "red", "rose", "sky", "slate", "stone", "taupe", "teal", "violet", "yellow", "zinc"]).optional(),
  /** What the agent does and when to delegate to it; other agents read it to decide, e.g. Builds and merges changes */
  description: z.string().optional(),
  /** Reasoning effort level for the agent's model, from low to max; the levels available depend on the model, and an agent without one inherits the effort of the agent that delegates to it, e.g. high */
  effort: z.enum(["low", "medium", "high", "xhigh", "max"]).optional(),
  /** Agents that take over when this agent's provider is unavailable or out of quota; tried in order, by id, e.g. [gH7kL2mN] */
  fallbacks: z.array(Id).optional(),
  /** Unique identifier for the agent; with name it forms the label, as in aB3dE9fG-builder, e.g. aB3dE9fG */
  id: Id,
  /** System prompt that defines the agent's behavior; the model reads it on every call, and omitting it keeps the provider's base prompt, e.g. Build the requested change, run the tests and open a pull request */
  instructions: z.string().optional(),
  /** MCP servers available to the agent, by the name of a server configured elsewhere; the agent can call their tools, e.g. github */
  mcpServers: z.array(z.string()).optional(),
  /** Persistent memory the agent reads and updates across sessions; local is this project only and kept out of version control, project is shared through the repo, user spans every project, and omitting it means no memory, e.g. project */
  memory: z.enum(["local", "project", "user"]).optional(),
  /** Key-value pairs for classifying, filtering and tracing the agent; values are strings, e.g. { team: platform } */
  metadata: z.record(z.string(), z.string()).optional(),
  /** Language model the agent runs on; provider/model, using the provider's own model ID, and an agent without one inherits the model of the agent that delegates to it, so a main agent sets one, e.g. anthropic/claude-opus-5-5 */
  model: z.templateLiteral([z.string().min(1), "/", z.string().min(1)]).optional(),
  /** Display name for the agent, also how other agents refer to it; with id it forms the label, e.g. builder */
  name: z.string(),
  /** Place of the agent in the team; a main agent sits at the top, above the orchestrators; an orchestrator is persistent, owns one area of the work and splits it into tasks for subagents; a subagent is started for one task and ends when it is done, and an agent with no role is one, e.g. orchestrator */
  role: z.enum(["main", "orchestrator", "subagent"]).default("subagent"),
  /** Names of the skills available to the agent; each is a set of reusable instructions the model loads on demand, e.g. api-conventions */
  skills: z.array(z.string()).optional(),
  /** Names of the tools the agent can use, MCP tools included; an agent without a list inherits every tool of the agent that delegates to it, and a main agent without one can use every tool, e.g. Read */
  tools: z.array(z.string()).optional(),
})

export type Agent = z.infer<typeof Agent>
