import * as z from "zod"

/** The choices that hold for the whole factory, each saved on its own and changed while it runs; an agent's own fields win over them */
export const Settings = z.object({
  // optional
  /** Bridge the factory runs its harnesses in, e.g. herdr */
  bridge: z.enum(["herdr"]).default("herdr"),
  /** Reasoning effort for an agent that sets none, from low to max; left out, the harness picks one, e.g. high */
  effort: z.enum(["low", "medium", "high", "xhigh", "max"]).optional(),
  /** Harness that runs each agent, e.g. claude-code */
  harness: z.enum(["claude-code"]).default("claude-code"),
  /** Model for an agent that names none, as provider/model with the provider's own model id; left out, the harness picks one, e.g. anthropic/claude-opus-5-5 */
  model: z.string().optional(),
  /** Whether the human is notified when an agent needs them, e.g. true */
  notifications: z.boolean().default(true),
  /** Permission flipper a new main agent starts at: ask the human, follow saved rules, or allow all; each main agent then flips its own, e.g. ask */
  permissionFlipper: z.enum(["ask", "rules", "allow-all"]).default("ask"),
  /** Color theme of the factory's UI, the same in every browser, where system follows the computer's, e.g. dark */
  theme: z.enum(["dark", "light", "system"]).default("system"),
})

export type Settings = z.infer<typeof Settings>
