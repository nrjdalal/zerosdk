import * as z from "zod"

import { Color, Effort, Memory, Role } from "@/common"

/** Configuration for an agent: a model with its own instructions, skills and MCP servers; other agents delegate tasks to it by its description */
export const Agent = z.object({
  /** Display color for the agent in lists and transcripts; one of the shared Tailwind colors, e.g. violet */
  color: Color.optional(),
  /** What the agent does and when to delegate to it; other agents read it to decide whether to delegate, e.g. Builds and merges changes */
  description: z.string().optional(),
  /** Reasoning effort level for the agent's model; omitting it uses the model's default, e.g. high */
  effort: Effort.optional(),
  /** Agents that take over when this agent's provider is unavailable or out of quota; tried in order, by id, e.g. [gH7kL2] */
  fallbacks: z.array(z.nanoid({ length: 6 }).regex(/^[A-Za-z0-9]+$/)).optional(),
  /** Unique identifier for the agent; 6 characters from a-z, A-Z and 0-9, and with name it forms the label, e.g. aB3dE9-builder */
  id: z.nanoid({ length: 6 }).regex(/^[A-Za-z0-9]+$/),
  /** System prompt that defines the agent's behavior; the model reads it on every turn, and omitting it keeps the provider's base prompt, e.g. Build the requested change, run the tests and open a pull request */
  instructions: z.string().optional(),
  /** MCP servers available to the agent, by the name of a server configured elsewhere; the agent can call their tools, e.g. github */
  mcpServers: z.array(z.string()).optional(),
  /** Persistent memory the agent reads and updates across sessions; omitting it means no memory, e.g. project */
  memory: Memory.optional(),
  /** Key-value labels for classifying, filtering and tracing the agent; values are strings and are never sent to the model, e.g. { team: platform } */
  metadata: z.record(z.string(), z.string()).optional(),
  /** Language model the agent runs on; provider/model, using the provider's own model ID, and an agent without one inherits the model of the agent that delegates to it, so a main agent sets one, e.g. anthropic/claude-opus-5-5 */
  model: z.templateLiteral([z.string().min(1), "/", z.string().min(1)]).optional(),
  /** Display name for the agent, also how other agents refer to it; with id it forms the label, e.g. builder */
  name: z.string(),
  /** Place of the agent in the team; one of the shared roles, and a subagent when omitted, e.g. orchestrator */
  role: Role.default("subagent"),
  /** Names of the skills available to the agent; each is a set of reusable instructions the model loads on demand, e.g. api-conventions */
  skills: z.array(z.string()).optional(),
})

export type Agent = z.infer<typeof Agent>
