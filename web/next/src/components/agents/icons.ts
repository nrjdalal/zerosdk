import type { Agent } from "@packages/schema/agent"
import {
  RiAlertFill,
  RiBinocularsFill,
  RiBookFill,
  RiBugFill,
  RiCalendarScheduleFill,
  RiCloseCircleFill,
  RiDatabase2Fill,
  RiEyeFill,
  RiFlag2Fill,
  RiForbidFill,
  RiGlobalFill,
  RiHammerFill,
  RiLoader4Fill,
  RiMagicFill,
  RiPauseCircleFill,
  RiPresentationFill,
  RiRoadMapFill,
  RiRocketFill,
  RiShieldFill,
  RiSignalCellular1Fill,
  RiSignalCellular2Fill,
  RiSignalCellular3Fill,
  RiSkull2Fill,
  RiSkullFill,
  RiTestTubeFill,
  RiTimeFill,
  RiZzzFill,
  type RemixiconComponentType,
} from "@remixicon/react"

import * as logos from "@/components/common/provider-logos"

// Each value's icon as the Icons docs page gives it: web/next/content/docs/ui/icons.mdx
export const effortIcons: Record<NonNullable<Agent["effort"]>, RemixiconComponentType> = {
  low: RiSignalCellular1Fill,
  medium: RiSignalCellular2Fill,
  high: RiSignalCellular3Fill,
  xhigh: RiSkullFill,
  max: RiSkull2Fill,
}

// Each provider's logo, keyed by its name as provider-logos names the component, with dashes and dots dropped, e.g. zai
export const providerIcons: Record<string, RemixiconComponentType> = Object.fromEntries(
  Object.entries(logos).map(([name, logo]) => [name.toLowerCase(), logo]),
)

// The logo of the provider in a provider/model ID, if one is drawn
export function providerIcon(model: string) {
  return providerIcons[model.split("/")[0].replaceAll(/[-.]/g, "")]
}

export const stateIcons = {
  cancelled: RiForbidFill,
  completed: RiFlag2Fill,
  failed: RiCloseCircleFill,
  idle: RiZzzFill,
  paused: RiPauseCircleFill,
  pending: RiCalendarScheduleFill,
  running: RiLoader4Fill,
  stuck: RiAlertFill,
  waiting: RiTimeFill,
} satisfies Record<string, RemixiconComponentType>

export const taskIcons = {
  build: RiHammerFill,
  data: RiDatabase2Fill,
  debug: RiBugFill,
  deploy: RiRocketFill,
  docs: RiBookFill,
  explain: RiPresentationFill,
  explore: RiBinocularsFill,
  plan: RiRoadMapFill,
  refactor: RiMagicFill,
  research: RiGlobalFill,
  review: RiEyeFill,
  security: RiShieldFill,
  test: RiTestTubeFill,
} satisfies Record<string, RemixiconComponentType>

export type AgentState = keyof typeof stateIcons

export type AgentTask = keyof typeof taskIcons
