import * as z from "zod"

/** One thing said or done in a session, by the human or an agent, stored exactly as it was written so the session can resume from it */
export const Message = z.object({
  // required
  /** The message as written, for a harness line the whole line untouched, e.g. { type: user, message: { role: user, content: Fix login } } */
  content: z.json(),
  /** Unique identifier for the message, a UUID version 7, which also holds the time it was stored, e.g. 01a15e51-fa00-7000-8000-000000000001 */
  id: z.uuidv7(),
  /** Session the message belongs to, by its id, e.g. 01a15e51-f987-775c-99f8-c0c2cdcddaaf */
  sessionId: z.uuidv7(),
  /** Place of the message in its file of the session, from 0, so a resume writes it back in order, e.g. 41 */
  sessionSeq: z.int(),
  /** Kind of message: the harness's own for its lines, or ZeroSDK's for its own, e.g. user */
  type: z.string(),
  // optional
  /** File of the session the message came from, left out for the main conversation; set for a subagent the harness started itself, e.g. subagents/agent-7c */
  subpath: z.string().optional(),
  /** Thread the message is routed to, by its id, e.g. 01a15e51-fa00-7000-8000-0000000000a1 */
  threadId: z.uuidv7().optional(),
  /** Place of the message in its thread, from 0, so the thread reads in order across sessions; set with threadId, e.g. 2 */
  threadSeq: z.int().optional(),
})

export type Message = z.infer<typeof Message>
