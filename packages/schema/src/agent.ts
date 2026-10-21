import * as z from "zod"

/** Configuration for an agent: a language model given one kind of work in the factory, shaped first around Claude */
export const Agent = z.object({
  // required
  /** What the agent does and when to delegate to it; Claude reads it to decide, 1 to 1,024 characters, e.g. Builds and merges changes */
  description: z.string().min(1).max(1024),
  /** Unique identifier for the agent, a UUID version 7; the harness writes it into Claude's name, so renaming the agent never breaks a session, e.g. 0193b2c4-7d1e-7a3f-9c2e-5b8a1d4e6f70 */
  id: z.uuidv7(),
  // optional
  /** Reasoning effort for the agent's model, from low to max; the levels available depend on the model, and left out, Claude uses the session's, e.g. high */
  effort: z.enum(["low", "medium", "high", "xhigh", "max"]).optional(),
  /** MCP servers the agent can reach, by the name of a server configured elsewhere; 1 to 64 of them, each 1 to 64 characters, e.g. github */
  // oxfmt-ignore
  mcpServers: z.array(z.string().min(1).max(64)).min(1).max(64).optional(),
  /** Folder the agent keeps notes in across sessions, named after its id; user spans every project, project is committed with the repo, and local stays out of version control, e.g. project */
  memory: z.enum(["local", "project", "user"]).optional(),
  /** Model the agent runs on, as provider/model with the provider's own model id; 1 to 256 characters, and left out, the harness picks one, e.g. anthropic/claude-opus-5-5 */
  model: z.string().min(1).max(256).optional(),
  /** Place of the agent in the team; a main agent sits at the top, above the orchestrators; an orchestrator is persistent, owns one area of the work and splits it into tasks for subagents; a subagent is started for one task and ends when it is done, and an agent with no role is one, e.g. orchestrator */
  role: z.enum(["main", "orchestrator", "subagent"]).default("subagent"),
  /** Skills loaded into the agent's context when it starts, by name; 1 to 64 of them, each 1 to 64 characters, e.g. api-conventions */
  // oxfmt-ignore
  skills: z.array(z.string().min(1).max(64)).min(1).max(64).optional(),
  /** Tools the agent may use, Claude's own or an MCP server's; left out, it may use every tool; 1 to 256 of them, each 1 to 256 characters, e.g. Read */
  // oxfmt-ignore
  tools: z.array(z.string().min(1).max(256)).min(1).max(256).optional(),
  // metadata
  /** Labels for classifying, filtering and tracing the agent; color and name are named, and any other label is a string, e.g. { color: purple, name: builder, team: platform } */
  // oxfmt-ignore
  metadata: z.object({
    /** Color Claude draws the agent in, in its task list and transcript, e.g. purple */
    color: z.enum(["blue", "cyan", "green", "orange", "pink", "purple", "red", "yellow"]).optional(),
    /** Name people see for the agent, free to change while its id stays, e.g. builder */
    name: z.string().min(1).max(256).optional(),
  }).catchall(z.string()).optional(),
})

export type Agent = z.infer<typeof Agent>
