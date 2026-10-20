import { asMarkdown } from "fumadocs-core/server"
import { Children } from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// A live component beside the code that renders it, as ui.shadcn.com shows its examples; the markdown copy keeps only the code.
export function DocsPreview({ children }: { children: React.ReactNode }) {
  const [preview, code] = Children.toArray(children).filter(
    (child) => typeof child !== "string" || child.trim(),
  )
  if (asMarkdown()) return code
  return (
    // The tabs are as tall as a sidebar row (h-8), with the panel 16px below
    <Tabs defaultValue="preview" className="gap-4">
      <TabsList className="group-data-horizontal/tabs:h-auto">
        <TabsTrigger value="preview" className="h-8">
          Preview
        </TabsTrigger>
        <TabsTrigger value="code" className="h-8">
          Code
        </TabsTrigger>
      </TabsList>
      {/* h-160 is a fumadocs code block at its tallest, a 600px scroll area under a 40px title, so a long demo's two tabs match */}
      <TabsContent
        value="preview"
        className="not-prose flex h-160 flex-none items-center justify-center rounded-xl border p-10"
      >
        {preview}
      </TabsContent>
      <TabsContent value="code" className="[&_figure]:my-0">
        {code}
      </TabsContent>
    </Tabs>
  )
}
