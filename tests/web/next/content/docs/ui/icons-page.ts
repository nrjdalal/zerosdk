import { join } from "node:path"

const page = await Bun.file(
  join(import.meta.dir, "../../../../../../web/next/content/docs/ui/icons.mdx"),
).text()

// Each section's table rows, past the header and divider, as trimmed cells, keyed by the section's heading.
export const tables: Record<string, string[][]> = Object.fromEntries(
  page
    .split(/^## /m)
    .slice(1)
    .map((section) => [
      section.slice(0, section.indexOf("\n")),
      section
        .split("\n")
        .filter((line) => line.startsWith("|"))
        .slice(2)
        .map((line) =>
          line
            .split("|")
            .slice(1, -1)
            .map((cell) => cell.trim()),
        ),
    ]),
)
