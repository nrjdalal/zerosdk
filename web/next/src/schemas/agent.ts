import * as z from "zod"

export const Agent = z.object({
  /** What the agent does; another agent reads it to decide whether to hand work over, e.g. Builds and merges changes */
  description: z.string(),
  /** Unique per agent: 6 characters from a–z, A–Z and 0–9; with name it makes the label, e.g. aB3dE9-builder */
  id: z.nanoid({ length: 6 }).regex(/^[A-Za-z0-9]+$/),
  /** What the agent is called, e.g. builder */
  name: z.string().regex(/^[a-z]+$/),
})

export type Agent = z.infer<typeof Agent>
