import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  // Software WebGL is CPU-heavy; serialize scenes to avoid starving browser input.
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    channel: "chrome",
    screenshot: "only-on-failure",
    launchOptions: {
      args: [
        "--enable-webgl",
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-unsafe-swiftshader",
      ],
    },
  },
  webServer: {
    command: "npm run dev -- --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
  },
  reporter: "list",
});
