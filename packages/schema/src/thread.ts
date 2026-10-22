import * as z from "zod"

/** One conversation kept apart from the others in a session: the messages about one thing the human asked, in order; its messages point at it */
export const Thread = z.object({
  // required
  /** Unique identifier for the thread, a UUID version 7, which also holds the time it started, e.g. 01a15e51-fa00-7000-8000-0000000000a1 */
  id: z.uuidv7(),
  /** What the human asked, as the sidebar and the inbox show it; renamable, e.g. Fix login */
  title: z.string(),
  // optional
  /** Time the thread was archived, in milliseconds since the epoch; left out while it is not, e.g. 1792577520000 */
  archivedAt: z.int().optional(),
  /** Time the human last read the thread, in milliseconds since the epoch; messages stored after it are unread, e.g. 1792573920000 */
  lastReadAt: z.int().optional(),
  /** Time the thread was pinned, in milliseconds since the epoch; left out while it is not, e.g. 1792570320000 */
  pinnedAt: z.int().optional(),
})

export type Thread = z.infer<typeof Thread>
