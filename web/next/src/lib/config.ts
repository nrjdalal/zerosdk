import { features as siteFeatures } from "@packages/config/site"
import { BUILD_VERSION } from "@packages/env"
import { env } from "@packages/env/web-next"

// Server-only env vars
const getInternalApiUrl = () => {
  if (typeof window === "undefined") {
    return env.INTERNAL_API_URL
  }
  return undefined
}

// On a public hosting suffix (baked NEXT_PUBLIC_IS_PRIVATE) the api is a sibling site the browser cannot share a cookie with, so client calls target the app origin and Next's /api rewrite proxies them to the api; the session cookie then lands first-party on the web. Server-side keeps the real api url (SSR reaches the api via internalUrl). With no api the app url stands in, so the auth and api clients still construct.
const getClientApiUrl = () => {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_IS_PRIVATE === "true") {
    return env.NEXT_PUBLIC_APP_URL
  }
  return env.NEXT_PUBLIC_API_URL ?? env.NEXT_PUBLIC_APP_URL
}

export const config = {
  // Runtime / env-derived app values (NOT brand, brand lives in @packages/config/site)
  app: {
    url: env.NEXT_PUBLIC_APP_URL,
    version: BUILD_VERSION,
  },

  // API configuration; enabled is false on a deploy with no api (NEXT_PUBLIC_API_URL unset), which then serves only its public pages: no sign-in, dashboard or console.
  api: {
    enabled: Boolean(env.NEXT_PUBLIC_API_URL),
    internalUrl: getInternalApiUrl(),
    url: getClientApiUrl(),
  },
} as const

export const servedFeatures = (hasApi: boolean) => ({
  ...siteFeatures,
  allowlist: siteFeatures.allowlist && hasApi,
  apiDocs: siteFeatures.apiDocs && hasApi,
  internalDocs: siteFeatures.internalDocs && hasApi,
  waitlist: siteFeatures.waitlist && hasApi,
})

export const features = servedFeatures(config.api.enabled)
