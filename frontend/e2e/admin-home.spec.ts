import { expect, test, type Page } from '@playwright/test';

const admin = {
    id: 1,
    email: 'admin@example.test',
    nom: 'Durand',
    prenom: 'Camille',
    roles: ['ROLE_MAIRIE', 'ROLE_ADMIN'],
    typeCompte: 'mairie',
    nomAssociation: null,
    logoUrl: null,
    modules: null,
};

const inDays = (days: number, hour: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
};

const dashboard = {
    pending: { registrations: 2, grants: 5, rooms: 3, equipment: 0, events: 1 },
    totals: { associations: 42, rooms: 6, equipment: 87 },
    latestRegistrations: [
        { id: 11, nom: 'Chorale du Bourg', createdAt: inDays(-1, 10), contact: 'Inès Leroy' },
        { id: 12, nom: 'Association Feytiat Pétanque', createdAt: inDays(-6, 9), contact: 'Marc Petit' },
    ],
    agenda: [
        { type: 'event', id: 4, title: 'Vide-grenier de printemps', place: 'Parc municipal', association: 'Comité des fêtes', startsAt: inDays(1, 8) },
        { type: 'room', id: 9, title: 'Assemblée générale', place: 'Salle des fêtes', association: 'Club de judo', startsAt: inDays(2, 18) },
        { type: 'equipment', id: 21, title: 'Kermesse de l’école', place: null, association: 'APE Feytiat', startsAt: inDays(3, 9) },
    ],
    campaign: { id: 3, seasonLabel: 'Saison 2027-2028', status: 'ACTIVE', openingAt: inDays(-10, 8), closingAt: inDays(20, 18), pendingWishes: 14 },
};

async function mockDashboard(page: Page, payload: unknown, status = 200) {
    await page.addInitScript((session) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'admin', user: session }));
    }, admin);
    await page.route(/\/api\//, async (route) => {
        const { pathname } = new URL(route.request().url());
        if (pathname === '/api/auth/session') return route.fulfill({ json: { user: admin } });
        if (pathname === '/api/admin/dashboard') return route.fulfill({ status, json: payload });
        return route.fulfill({ json: { items: [], totalItems: 0 } });
    });
}

test.describe('Accueil administrateur', () => {
    test('Affiche la charge du jour, l’agenda et les inscriptions', async ({ page }) => {
        await mockDashboard(page, dashboard);
        await page.goto('/admin/dashboard');

        await expect(page.getByRole('heading', { level: 1 })).toContainText('Camille');
        await expect(page.getByText('11 dossiers attendent une décision, dont 5 côté subventions.')).toBeVisible();

        const queues = page.getByRole('region', { name: 'Ce qui attend votre décision' });
        await expect(queues.getByRole('link', { name: /Subventions\s*5\s*dossiers à instruire/ })).toHaveAttribute('href', '/admin/subvention');
        await expect(queues.getByRole('link', { name: /Matériel\s*0\s*Rien en attente/ })).toBeVisible();

        await expect(page.getByRole('link', { name: /Vide-grenier de printemps/ })).toHaveAttribute('href', '/admin/evenements');
        await expect(page.getByRole('link', { name: /Chorale du Bourg/ })).toHaveAttribute('href', '/admin/inscription/dossier?id=11');
        await expect(page.getByText('14 vœux à arbitrer', { exact: false })).toBeVisible();

    });

    test('Signale une erreur de chargement sans casser la page', async ({ page }) => {
        await mockDashboard(page, { message: 'Erreur' }, 500);
        await page.goto('/admin/dashboard');

        await expect(page.getByText('Impossible de charger les chiffres du jour.', { exact: false })).toBeVisible();
        await expect(page.getByRole('heading', { level: 1 })).toContainText('Camille');
    });
});
