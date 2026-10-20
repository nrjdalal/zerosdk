import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/agent.ts", "src/common.ts"],
  minify: true,
  outDir: "dist",
})
