import { describe, expect, test } from "bun:test"

import { features as siteFeatures } from "../../../../../packages/config/src/site"
import { servedFeatures } from "../../../../../web/next/src/lib/config"

describe("servedFeatures", () => {
  test("serves the site's features as set when there is an api", () => {
    expect(servedFeatures(true)).toEqual(siteFeatures)
  })

  test("turns the features that need the api off when there is no api, and keeps the rest", () => {
    const served = servedFeatures(false)
    expect(served.allowlist).toBe(false)
    expect(served.apiDocs).toBe(false)
    expect(served.internalDocs).toBe(false)
    expect(served.waitlist).toBe(false)
    expect(served.blog).toBe(siteFeatures.blog)
    expect(served.docs).toBe(siteFeatures.docs)
  })
})
