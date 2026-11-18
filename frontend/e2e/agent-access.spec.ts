import { expect, test, type Page } from '@playwright/test';

const user = (roles: string[]) => ({
    id: 7,
    email: 'agent@example.test',
    nom: 'Martin',
    prenom: 'Lou',
    roles,
    typeCompte: 'mairie',
    nomAssociation: null,
    logoUrl: null,
    modules: null,
});

async function mockSession(page: Page, roles: string[]) {
    await page.addInitScript((session) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'admin', user: session }));
    }, user(roles));

    await page.route(/\/api\//, async (route) => {
        const { pathname } = new URL(route.request().url());
        if (pathname === '/api/auth/session') return route.fulfill({ json: { user: user(roles) } });
        if (pathname === '/api/admin/agents') {
            return route.fulfill({
                json: {
                    items: [{ ...user(roles), telephone: null, isVerified: true, status: 'ACTIVE', createdAt: null }],
                    page: 1,
                    itemsPerPage: 50,
                    totalItems: 1,
                },
            });
        }
        return route.fulfill({ json: [] });
    });
}

test.describe('Droits des agents', () => {
    test('Un agent ne voit et n’ouvre que les pages de ses modules', async ({ page }) => {
        await mockSession(page, ['ROLE_MAIRIE', 'ROLE_GESTION_MATERIEL']);

        await page.goto('/admin/agent');

        await page.waitForURL(/\/admin\/materiel$/);
        const menu = page.getByRole('navigation', { name: 'Menu principal administration' });
        await expect(menu.getByRole('link', { name: 'Matériel' })).toBeVisible();
        await expect(menu.getByRole('link')).toHaveCount(1);
    });

    test('Un administrateur ne peut pas retirer ses propres droits', async ({ page }) => {
        await mockSession(page, ['ROLE_MAIRIE', 'ROLE_ADMIN']);

        await page.goto('/admin/agent');
        await page.getByRole('button', { name: /agent@example.test/ }).click();

        await expect(page.getByRole('switch', { name: 'Accès administrateur' })).toBeDisabled();
        await expect(page.getByRole('switch', { name: 'Module Salle' })).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Supprimer le compte' })).toHaveCount(0);
    });
});
