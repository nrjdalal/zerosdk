import { getPageTreePeers } from "fumadocs-core/page-tree"
import { asMarkdown, md } from "fumadocs-core/server"
import { Card, Cards } from "fumadocs-ui/components/card"

import { docsSource } from "@/lib/source"

// The pages beside url as cards, each with its title and description (https://fumadocs.dev/docs/markdown#further-reading-section), and as a link list in the page's markdown.
export function DocsCategory({ url }: { url: string }) {
  const peers = getPageTreePeers(docsSource.getPageTree(), url)
  if (asMarkdown())
    return md`${peers.map((peer) => md`- [${peer.name}](${peer.url}): ${peer.description}\n`)}`
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
