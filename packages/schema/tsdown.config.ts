import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/agent.ts", "src/message.ts", "src/session.ts", "src/thread.ts"],
  minify: true,
  outDir: "dist",
})
