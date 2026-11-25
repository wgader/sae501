import { expect, test, type Page } from '@playwright/test';

const agent = (roles: string[]) => ({
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

const audit = { updatedAt: null, updatedBy: null };
const roomSettings = { openingHour: 8, closingHour: 23, oneOffMaxDays: 3, limits: { oneOffMaxDays: 14 }, ...audit };
const equipmentSettings = {
    deskOpening: '08:00',
    deskClosing: '19:00',
    pickupLocation: null,
    maxQuantityPerRequest: null,
    defaultMaxDays: 7,
    limits: { maxQuantityPerRequest: 1000, defaultMaxDays: 90, pickupLocation: 255 },
    ...audit,
};

async function mockSettings(page: Page, roles: string[]) {
    const sent: { method: string; path: string; body: unknown }[] = [];
    const categories = [
        { id: 1, code: 'barnums', label: 'Barnums & Tentes', equipmentCount: 3 },
        { id: 2, code: 'ceremonies-protocole', label: 'Cérémonies & Protocole', equipmentCount: 0 },
    ];

    await page.addInitScript((session) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'admin', user: session }));
    }, agent(roles));

    await page.route(/\/api\//, async (route) => {
        const request = route.request();
        const { pathname } = new URL(request.url());
        const method = request.method();
        const body = request.postData() ? JSON.parse(request.postData() as string) : null;
        if (method !== 'GET') sent.push({ method, path: pathname, body });

        if (pathname === '/api/auth/session') return route.fulfill({ json: { user: agent(roles) } });
        if (pathname === '/api/admin/salles/settings') {
            if (method === 'PUT') return route.fulfill({ json: { ...roomSettings, ...body, updatedAt: '2026-11-23T10:00:00+01:00', updatedBy: 'Lou Martin' } });
            return route.fulfill({ json: roomSettings });
        }
        if (pathname === '/api/admin/equipment/settings') {
            if (method === 'PUT') {
                return route.fulfill({ status: 422, json: { message: 'Certains réglages sont invalides.', errors: { pickupLocation: 'Le lieu de retrait est refusé par le serveur.' } } });
            }
            return route.fulfill({ json: equipmentSettings });
        }
        if (pathname === '/api/admin/equipment/categories') {
            if (method === 'POST') {
                if (body.label.toLowerCase() === 'barnums & tentes') {
                    return route.fulfill({ status: 422, json: { message: 'Certains réglages sont invalides.', errors: { label: 'Une catégorie porte déjà ce nom.' } } });
                }
                return route.fulfill({ status: 201, json: { id: 3, code: 'jeux', label: body.label, equipmentCount: 0 } });
            }
            return route.fulfill({ json: categories });
        }
        if (pathname === '/api/admin/equipment/categories/2' && method === 'DELETE') return route.fulfill({ status: 204, body: '' });
        return route.fulfill({ json: [] });
    });

    return sent;
}

test.describe('Réglages', () => {
    test('Les horaires des salles sont contrôlés avant l’envoi puis enregistrés', async ({ page }) => {
        const sent = await mockSettings(page, ['ROLE_MAIRIE', 'ROLE_ADMIN']);
        await page.goto('/admin/reglages');

        await expect(page.getByRole('tab', { name: /Salles/ })).toHaveAttribute('aria-selected', 'true');
        await page.getByLabel('Ouverture', { exact: true }).selectOption('20');
        await page.getByLabel('Fermeture', { exact: true }).selectOption('9');
        await page.getByRole('button', { name: 'Enregistrer' }).click();

        await expect(page.getByText('La fermeture doit être après l’ouverture.')).toBeVisible();
        await expect(page.getByLabel('Fermeture', { exact: true })).toHaveAttribute('aria-invalid', 'true');
        expect(sent).toHaveLength(0);

        await page.getByLabel('Fermeture', { exact: true }).selectOption('22');
        await page.getByRole('button', { name: 'Enregistrer' }).click();

        await expect(page.getByText(/Réglages des salles enregistrés/)).toBeVisible();
        await expect(page.getByText(/par Lou Martin/)).toBeVisible();
        expect(sent[0]).toEqual({ method: 'PUT', path: '/api/admin/salles/settings', body: { openingHour: 20, closingHour: 22, oneOffMaxDays: 3 } });
    });

    test('Le matériel affiche les erreurs du serveur et protège les catégories utilisées', async ({ page }) => {
        const sent = await mockSettings(page, ['ROLE_MAIRIE', 'ROLE_ADMIN']);
        await page.goto('/admin/reglages');
        await page.getByRole('tab', { name: /Matériel/ }).click();

        await page.getByLabel('Lieu de retrait et de restitution').fill('Mairie');
        await page.getByRole('button', { name: 'Enregistrer' }).click();
        await expect(page.getByText('Le lieu de retrait est refusé par le serveur.')).toBeVisible();

        await page.getByLabel('Nom de la nouvelle catégorie').fill('Barnums & Tentes');
        await page.getByRole('button', { name: 'Ajouter' }).click();
        await expect(page.getByText('Une catégorie porte déjà ce nom.')).toBeVisible();

        await expect(page.getByRole('button', { name: /Barnums & Tentes » contient 3 équipements/ })).toBeDisabled();
        await page.getByRole('button', { name: 'Supprimer « Cérémonies & Protocole »' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Supprimer' }).click();
        await expect(page.getByText('Catégorie « Cérémonies & Protocole » supprimée.')).toBeVisible();
        expect(sent.at(-1)).toEqual({ method: 'DELETE', path: '/api/admin/equipment/categories/2', body: null });
    });

    test('Un agent du matériel ne voit que les réglages du matériel', async ({ page }) => {
        await mockSettings(page, ['ROLE_MAIRIE', 'ROLE_GESTION_MATERIEL']);
        await page.goto('/admin/reglages');

        await expect(page.getByRole('tab')).toHaveCount(1);
        await expect(page.getByRole('tab', { name: /Matériel/ })).toBeVisible();
        await expect(page.getByRole('navigation', { name: 'Menu principal administration' }).getByRole('link', { name: 'Réglages' })).toBeVisible();
    });
});
