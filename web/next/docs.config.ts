import { site } from "@packages/config/site"

import type { DocsConfig } from "./src/lib/docs"

const docsConfig = {
  docs: {
    "Getting Started": [
      {
        "/docs": {
          title: "Overview",
          description: `${site.description} This overview lists every page in its documentation.`,
        },
      },
    ],
    Reference: [
      {
        "/docs/reference/agent": {
          title: "Agent",
          description: "Reference for the Agent schema.",
        },
      },
      {
        "/docs/reference/session": {
          title: "Session",
          description: "Reference for the Session schema.",
        },
      },
      {
        "/docs/reference/message": {
          title: "Message",
          description: "Reference for the Message schema.",
        },
      },
      {
        "/docs/reference/thread": {
          title: "Thread",
          description: "Reference for the Thread schema.",
        },
      },
    ],
    UI: [
      {
        "/docs/ui/icons": {
          title: "Icons",
          description: "Reference for the icons the UI uses.",
        },
      },
      {
        "/docs/ui/sidebar": {
          title: "Sidebar",
          description: "Reference for the agents sidebar.",
        },
      },
    ],
  },
  console: {
    "Getting Started": [
      {
        "/console/docs": {
          title: "Introduction",
          description: "Internal documentation.",
        },
      },
    ],
  },
} satisfies DocsConfig

export default docsConfig
