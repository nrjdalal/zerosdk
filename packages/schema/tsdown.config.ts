import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/agent.ts"],
  minify: true,
  outDir: "dist",
})
