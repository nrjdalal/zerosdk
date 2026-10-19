import * as z from "zod"

export const Agent = z.object({
  /** What the agent does and when to delegate to it; other agents read it to decide, e.g. Builds and merges changes */
  description: z.string(),
  /** Unique identifier for the agent: 6 characters from a-z, A-Z and 0-9; with name it forms the label, e.g. aB3dE9-builder */
  id: z.nanoid({ length: 6 }).regex(/^[A-Za-z0-9]+$/),
  /** Display name for the agent, e.g. builder */
  name: z.string(),
})

export type Agent = z.infer<typeof Agent>
