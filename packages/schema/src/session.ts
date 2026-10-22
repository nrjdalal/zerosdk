import * as z from "zod"

/** One agent's working context in the factory, from its start until it stops; a subagent's session points at the session that started it */
export const Session = z.object({
  // required
  /** Agent the session runs, by the agent's id, e.g. 0193b2c4-7d1e-7a3f-9c2e-5b8a1d4e6f70 */
  agentId: z.uuidv7(),
  /** Working directory the session runs in, its worktree, e.g. /home/dev/zerosdk/.claude/worktrees/add-tools */
  cwd: z.string(),
  /** Unique identifier for the session, a UUID version 7, which also holds the time it started, e.g. 0193b2c5-1a2b-7c3d-8e4f-5a6b7c8d9e0f */
  id: z.uuidv7(),
  /** Where the session is in its life; cancelled was stopped; completed finished its task; failed ended on an error; idle finished its turn and can take more; paused is held until a limit lifts; pending has not started work; running is working; stuck is not moving and asked nothing the factory understands, so a person has to look at it; and waiting asked the human something, a question or a permission, and holds for the answer, e.g. running */
  // oxfmt-ignore
  status: z.enum(["cancelled", "completed", "failed", "idle", "paused", "pending", "running", "stuck", "waiting"]),
  /** Time the session last changed, in milliseconds since the epoch; the sidebar sorts by it, e.g. 1792573920000 */
  updatedAt: z.int(),
  // optional
  /** Session id the harness gives the session, which it takes back to resume it; set once the harness has started, e.g. 9f2c6a1e-3b4d-4c5e-8f9a-0b1c2d3e4f5a */
  harnessSessionId: z.string().optional(),
  /** Session that started this one, by its id; set only on a subagent's session, e.g. 0193b2c5-0f1e-7d2c-9b3a-4e5f6a7b8c9d */
  parentId: z.uuidv7().optional(),
  /** What the session was asked to do, in the words of whoever started it; a main agent's session has none, e.g. Fix the login redirect */
  prompt: z.string().optional(),
  /** Time a paused session's limit lifts, in milliseconds since the epoch, so the factory knows when to resume it; left out when the limit gives no time, e.g. 1792577520000 */
  resetsAt: z.int().optional(),
  // metadata
  /** Labels that show the session but do not change how it runs, e.g. { task: debug, title: Fix login } */
  // oxfmt-ignore
  metadata: z.object({
    /** Git branch of the session's worktree, e.g. feat/add-tools */
    branch: z.string().optional(),
    /** Issue the session works on, in the tracker that holds it, e.g. { key: ZS-12, url: https://tracker.example.com/ZS-12 } */
    issue: z.object({
      /** Key the tracker shows for the issue, e.g. ZS-12 */
      key: z.string(),
      /** Link to the issue, e.g. https://tracker.example.com/ZS-12 */
      url: z.url(),
    }).optional(),
    /** Pull request the session opened, or merge request on GitLab, filled in once it opens one, e.g. { number: 45, url: https://github.com/nrjdalal/zerosdk/pull/45 } */
    pr: z.object({
      /** Number of the pull request, e.g. 45 */
      number: z.int(),
      /** Link to the pull request, e.g. https://github.com/nrjdalal/zerosdk/pull/45 */
      url: z.url(),
    }).optional(),
    /** Why the session has its status, in a few words, e.g. usage limit */
    reason: z.string().optional(),
    /** Kind of work the session does, one of the kinds on the icons page, which picks its row's icon; set by whoever starts the session, e.g. debug */
    task: z.enum(["build", "data", "debug", "deploy", "docs", "explain", "explore", "plan", "refactor", "research", "review", "security", "test"]).optional(),
    /** Short name for the session, generated from its prompt or set by a person, e.g. Fix login */
    title: z.string().optional(),
  }).optional(),
})

export type Session = z.infer<typeof Session>
