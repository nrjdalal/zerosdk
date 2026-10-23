import { accessSync, constants } from "node:fs"
import { delimiter, join } from "node:path"

// Every executable `name` the shell would find on PATH, in PATH order and once each.
export const which = (name: string, searchPath: string) =>
  [
    ...new Set(
      searchPath
        .split(delimiter)
        .filter(Boolean)
        .map((dir) => join(dir, name)),
    ),
  ].filter((candidate) => {
    try {
      accessSync(candidate, constants.X_OK)
      return true
    } catch {
      return false
    }
  })
