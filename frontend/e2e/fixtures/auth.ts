import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
    loginAsAdmin: (page: Page) => Promise<void>;
    loginAsUser: (page: Page) => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
    loginAsAdmin: async ({ }, use) => {
        const login = async (page: Page) => {
            const email = process.env.TEST_ADMIN_EMAIL || '';
            const password = process.env.TEST_ADMIN_PASSWORD || '';

            await page.goto('/admin');
            await page.fill('input[type="email"]', email);
            await page.fill('input[type="password"]', password);
            await page.click('button[type="submit"]');
            await page.waitForURL('/admin/dashboard');
        };
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use(login);
    },
    loginAsUser: async ({ }, use) => {
        const login = async (page: Page) => {
            const email = process.env.TEST_USER_EMAIL || '';
            const password = process.env.TEST_USER_PASSWORD || '';

            await page.goto('/connexion');
            await page.fill('input[type="email"]', email);
            await page.fill('input[type="password"]', password);
            await page.click('button[type="submit"]');
            await page.waitForURL('**/');
        };
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use(login);
    },
});

export { expect } from '@playwright/test';