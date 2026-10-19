import { getPageTreePeers } from "fumadocs-core/page-tree"
import { asMarkdown, md } from "fumadocs-core/server"
import { Card, Cards } from "fumadocs-ui/components/card"

import { config } from "@/lib/config"
import { contentSource } from "@/lib/content"

// The documented further reading cards: https://fumadocs.dev/docs/markdown#further-reading-section
export function DocsCategory({ url }: { url: string }) {
  const peers = getPageTreePeers(contentSource("docs").tree(), url)
  if (asMarkdown())
    return md`${peers.map((peer) => md`- [${peer.name}](${config.app.url}${peer.url}.md): ${peer.description}\n`)}`
  return (
    <Cards>
      {peers.map((peer) => (
        <Card key={peer.url} title={peer.name} href={peer.url}>
          {peer.description}
        </Card>
      ))}
    </Cards>
  )
}
