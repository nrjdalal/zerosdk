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
          description:
            "Reference for the Agent schema: the configuration that defines an agent, from its model and instructions to its role in the team.",
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
