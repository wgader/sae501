import { defineConfig, devices } from '@playwright/test';

// Sans adresse fournie, les tests lancent next dev ; en CI, ils visent l'image de production.
const externalBaseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL;

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    // Évite qu’une API indisponible bloque la CI pendant des dizaines de minutes.
    globalTimeout: process.env.CI ? 15 * 60 * 1000 : undefined,
    workers: process.env.CI ? 1 : 1,
    reporter: [['html', { open: 'never' }], ['list']],
    use: {
        baseURL: externalBaseUrl ?? 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
        {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
        },
    ],
    webServer: externalBaseUrl
        ? undefined
        : {
              command: 'npm run dev',
              url: 'http://localhost:3000',
              reuseExistingServer: true,
              timeout: 120000,
          },
});