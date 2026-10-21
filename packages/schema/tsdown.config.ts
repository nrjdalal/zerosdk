import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/agent.ts", "src/session.ts"],
  minify: true,
  outDir: "dist",
})
