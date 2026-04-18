import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 90 * 1000,
    expect: {
        timeout: 10 * 1000,
    },
    fullyParallel: false,
    retries: process.env.CI ? 2 : 0,
    reporter: [
        ['list'],
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ],
    use: {
        baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
        headless: true,
        actionTimeout: 12 * 1000,
        navigationTimeout: 30 * 1000,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure',
    },
});
