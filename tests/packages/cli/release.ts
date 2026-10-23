// A stand-in herdr release asset: a script that answers --version the way herdr does, with a version of its own so a test can tell it from the pin.
export const releaseVersion = "herdr 0.0.0-test"
export const release = `#!/bin/sh\necho ${releaseVersion}\n`
export const asset = {
  name: "herdr-test",
  sha256: new Bun.CryptoHasher("sha256").update(release).digest("hex"),
}

// The release download server: the asset, a tampered copy of it, and a 404 for anything else; `requests` records each path asked for.
export const serveRelease = () => {
  const requests: string[] = []
  const server = Bun.serve({
    fetch: (request) => {
      const { pathname } = new URL(request.url)
      requests.push(pathname)
      if (pathname === "/herdr-test") return new Response(release)
      if (pathname === "/herdr-tampered") return new Response(`${release}# tampered\n`)
      return new Response("Not Found", { status: 404 })
    },
    port: 0,
  })
  return { requests, server, url: server.url.origin }
}
