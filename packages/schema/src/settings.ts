import * as z from "zod"

/** The choices that hold for the whole factory, each saved on its own and changed while it runs */
export const Settings = z.object({
  // optional
  /** Bridge the factory runs its harnesses in, e.g. herdr */
  bridge: z.enum(["herdr"]).default("herdr"),
  /** Harness that runs each agent, e.g. claude-code */
  harness: z.enum(["claude-code"]).default("claude-code"),
  /** Whether the human is notified when an agent needs them, e.g. true */
  notifications: z.boolean().default(true),
  /** Permission mode each agent starts in, one of Claude's own; bypassPermissions runs tools without asking, except what Claude asks about in every mode, such as ask rules and questions, e.g. bypassPermissions */
  // oxfmt-ignore
  permissionMode: z.enum(["acceptEdits", "auto", "bypassPermissions", "default", "dontAsk", "plan"]).default("bypassPermissions"),
  /** Color theme of the factory's UI, the same in every browser, where system follows the computer's, e.g. dark */
  theme: z.enum(["dark", "light", "system"]).default("system"),
})

export type Settings = z.infer<typeof Settings>
