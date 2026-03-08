import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const repoBase = "/crusible_of_champions/";

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? repoBase : "/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
});
