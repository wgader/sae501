import { test as base, Page } from '@playwright/test';

type AuthFixtures = {
    loginAsAdmin: (page: Page) => Promise<void>;
    loginAsUser: (page: Page) => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
    loginAsAdmin: async ({ }, use) => {
        const login = async (page: Page) => {
            await page.goto('/admin');
            await page.fill('input[type="email"]', 'admin@feytiat.fr');
            await page.fill('input[type="password"]', 'AdminMairie2026!');
            await page.click('button[type="submit"]');
            await page.waitForURL('/admin/dashboard');
        };
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use(login);
    },
    loginAsUser: async ({ }, use) => {
        const login = async (page: Page) => {
            await page.goto('/connexion');
            await page.fill('input[type="email"]', 'user@association.fr');
            await page.fill('input[type="password"]', 'UserPassword123!');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/');
        };
        // eslint-disable-next-line react-hooks/rules-of-hooks
        await use(login);
    },
});

export { expect } from '@playwright/test';