import { expect, test, type Page } from '@playwright/test';

const agent = {
    id: 7,
    email: 'agent@example.test',
    nom: 'Martin',
    prenom: 'Lou',
    roles: ['ROLE_MAIRIE', 'ROLE_ADMIN'],
    typeCompte: 'mairie',
    nomAssociation: null,
    logoUrl: null,
    modules: null,
};

const notification = (id: number, type: string, eventId: number | null) => ({
    id,
    title: `Notification ${id}`,
    message: 'Message de test',
    type,
    event_id: eventId,
    read_at: null,
    created_at: '2026-11-23T10:00:00+00:00',
});

async function mockAdmin(page: Page, items: ReturnType<typeof notification>[]) {
    const readCalls: string[] = [];
    await page.addInitScript((session) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'admin', user: session }));
    }, agent);

    await page.route(/\/api\//, async (route) => {
        const { pathname } = new URL(route.request().url());
        if (pathname === '/api/auth/session') return route.fulfill({ json: { user: agent } });
        if (pathname === '/api/notifications') return route.fulfill({ json: { items, unreadCount: items.length } });
        if (/^\/api\/notifications\/\d+\/read$/.test(pathname)) {
            readCalls.push(pathname);
            return route.fulfill({ json: { ...items[0], read_at: '2026-11-23T10:05:00+00:00' } });
        }
        return route.fulfill({ json: [] });
    });

    return readCalls;
}

test.describe('Notifications', () => {
    test('Une notification sans page dédiée est marquée lue sans quitter la page', async ({ page }) => {
        const readCalls = await mockAdmin(page, [notification(1, 'ACCOUNT_INFO', null)]);
        await page.goto('/admin/materiel');

        await page.getByRole('button', { name: '1 notification non lue' }).click();
        await page.getByRole('button', { name: /Notification 1/ }).click();

        await expect(page).toHaveURL(/\/admin\/materiel$/);
        expect(readCalls).toEqual(['/api/notifications/1/read']);
    });

    test('Une pièce déposée ouvre les pièces de l’évènement', async ({ page }) => {
        await mockAdmin(page, [notification(2, 'EVENT_FILE_UPLOADED', 42)]);
        await page.goto('/admin/materiel');

        await page.getByRole('button', { name: '1 notification non lue' }).click();
        await page.getByRole('link', { name: /Notification 2/ }).click();

        await expect(page).toHaveURL(/\/admin\/evenements\/pieces-annexes\?id=42$/);
    });
});
