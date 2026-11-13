import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir:"./tests/e2e", timeout:45_000, fullyParallel:false, workers:1, reporter:"list",
  use:{baseURL:"http://127.0.0.1:4331",trace:"retain-on-failure",colorScheme:"light"},
  webServer:{command:"node tests/e2e/servidor-estatico.mjs 4331",url:"http://127.0.0.1:4331",reuseExistingServer:false},
  projects:[
    {name:"escritorio",use:{...devices["Desktop Chrome"],viewport:{width:1440,height:1000}}},
    {name:"movil",use:{...devices["iPhone 13"],defaultBrowserType:"chromium"}},
  ],
});

