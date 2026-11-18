import { expect, test, type Page } from '@playwright/test';

const room = (id: number, nom: string, capaciteMax: number, accesPmr: boolean) => ({
    id,
    nom,
    description: null,
    imageUrl: null,
    adresse: '1 rue de la Mairie',
    capaciteMax,
    accesPmr,
    equipementsInclus: [],
    horairesOuverture: { debut: '08:00', fin: '23:00' },
    isActive: true,
});

const ROOMS = [
    room(1, 'Salle libre accessible', 80, true),
    room(2, 'Salle déjà réservée', 80, true),
    room(3, 'Salle libre sans accès', 80, false),
    room(4, 'Petite salle libre', 10, true),
];

const CAMPAIGN = {
    id: 7,
    seasonLabel: 'Saison 2028',
    openingAt: '2027-01-01T00:00:00+01:00',
    closingAt: '2099-09-30T23:59:59+02:00',
    periodStart: '2098-01-01',
    periodEnd: '2098-12-31',
    resourceTypes: ['salle'],
    status: 'ACTIVE',
    createdAt: '2027-01-01T00:00:00+01:00',
    updatedAt: '2027-01-01T00:00:00+01:00',
};

const USER = {
    id: 1,
    email: 'membre@example.test',
    nom: 'Membre',
    prenom: 'Club',
    roles: ['ROLE_ASSOCIATION'],
    typeCompte: 'association',
    nomAssociation: 'Club de test',
    logoUrl: null,
    modules: { subventions: true, materiel: true, salles: true, evenements: true },
};

/** Simule l'API : la salle 2 est occupée, et chaque vérification de disponibilité est comptée. */
async function mockApi(page: Page, campaignOpen: boolean) {
    const availabilityCalls: string[] = [];

    await page.addInitScript((user) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'association', user }));
    }, USER);

    await page.route(/\/api\//, async (route) => {
        const url = new URL(route.request().url());
        const json = (body: unknown) => route.fulfill({ json: body });

        if (url.pathname === '/api/auth/session') return json({ user: USER });
        if (url.pathname === '/api/rooms') return json(ROOMS);
        if (url.pathname === '/api/campaigns/current') {
            return json({ active: campaignOpen, campaign: campaignOpen ? CAMPAIGN : null });
        }
        if (url.pathname === '/api/campaigns/current/requests') {
            return json({ campaign: campaignOpen ? CAMPAIGN : null, requests: [] });
        }

        const availability = url.pathname.match(/^\/api\/rooms\/(\d+)\/availability$/);
        if (availability) {
            availabilityCalls.push(url.search);
            const occupied = availability[1] === '2'
                ? [{ id: 9, start: '', end: '', statut: 'Validée', isPreReserved: false, campaignId: null }]
                : [];
            return json({ room: ROOMS[0], start: '', end: '', occupiedSlots: occupied });
        }

        return json([]);
    });

    return availabilityCalls;
}

async function chooseSlot(page: Page, attendees: string) {
    await page.getByRole('button', { name: 'Choisir un créneau' }).click();
    await page.getByRole('button', { name: 'Mois suivant' }).click();
    await page.getByRole('button', { name: '15', exact: true }).click();
    await page.getByLabel('Nombre de personnes').fill(attendees);
    await page.getByRole('button', { name: 'Valider le créneau' }).click();
}

test.describe('Choix d’une salle', () => {
    test('En ponctuel, seules les salles libres et assez grandes sont proposées', async ({ page }) => {
        const availabilityCalls = await mockApi(page, false);
        await page.goto('/salles');
        await chooseSlot(page, '30');

        await expect(page.getByText('2 salles disponibles')).toBeVisible();
        await expect(page.getByText('Salle libre accessible')).toBeVisible();
        await expect(page.getByText('Salle libre sans accès')).toBeVisible();
        await expect(page.getByText('Salle déjà réservée')).toHaveCount(0);
        await expect(page.getByText('Petite salle libre')).toHaveCount(0);
        expect(availabilityCalls[0]).toContain('start=');

        await page.getByRole('button', { name: 'Filtres' }).click();
        await page.getByLabel('Accessible aux personnes à mobilité réduite').check();
        await page.getByRole('button', { name: 'Voir 1 salle' }).click();

        await expect(page.getByText('1 salle disponible')).toBeVisible();
        await expect(page.getByText('Salle libre sans accès')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Filtres (1)' })).toBeVisible();
    });

    test('En campagne, un créneau déjà demandé reste proposé pour l’arbitrage', async ({ page }) => {
        const availabilityCalls = await mockApi(page, true);
        await page.goto('/campagne');
        await chooseSlot(page, '30');

        await expect(page.getByText('3 salles', { exact: true })).toBeVisible();
        await expect(page.getByText('Salle déjà réservée')).toBeVisible();
        await expect(page.getByText('Petite salle libre')).toHaveCount(0);
        expect(availabilityCalls).toHaveLength(0);
    });
});
