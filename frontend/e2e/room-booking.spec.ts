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

const now = new Date();
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const monthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(nextMonth);
const FULL_DAY = `${monthKey}-15`;

const RULES = {
    lastDay: '2099-12-31',
    maxDays: 3,
    stepMinutes: 10,
    minMinutes: 30,
    openingTime: '08:00',
    closingTime: '23:00',
    blockedPeriods: [],
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
        if (url.pathname === '/api/rooms/booking-rules') return json(RULES);
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
                ? [{ id: 9, start: `${FULL_DAY}T08:00:00+00:00`, end: `${FULL_DAY}T23:00:00+00:00`, statut: 'Validée', isPreReserved: false, campaignId: null }]
                : [];
            return json({ room: ROOMS[0], start: '', end: '', occupiedSlots: occupied });
        }

        return json([]);
    });

    return availabilityCalls;
}

test.describe('Choix d’une salle', () => {
    const dayButton = (page: Page, day: number) => page.getByRole('button', { name: new RegExp(` ${day} ${monthLabel}, `) });

    test('En ponctuel, la recherche ne garde que les salles libres et assez grandes', async ({ page }) => {
        await mockApi(page, false);
        await page.goto('/salles');
        await expect(page.getByText('4 salles', { exact: true })).toBeVisible();

        await page.getByRole('button', { name: /Dates/ }).click();
        await page.getByRole('button', { name: 'Mois suivant' }).click();
        await dayButton(page, 15).first().click();
        await page.getByLabel('Nombre de personnes').fill('30');
        await page.getByRole('button', { name: 'Voir les salles libres' }).click();

        await expect(page.getByText('2 salles libres')).toBeVisible();
        await expect(page.getByText('Salle déjà réservée')).toHaveCount(0);
        await expect(page.getByText('Petite salle libre')).toHaveCount(0);

        await page.getByRole('button', { name: 'Filtres' }).click();
        await page.getByLabel('Accessible aux personnes à mobilité réduite').check();
        await page.getByRole('button', { name: 'Voir 1 salle' }).click();

        await expect(page.getByText('1 salle libre')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Filtres (1)' })).toBeVisible();
    });

    test('Le calendrier barre les jours complets et limite la durée', async ({ page }) => {
        await mockApi(page, false);
        await page.goto('/salles');
        await page.locator('article', { hasText: 'Salle déjà réservée' }).getByRole('button', { name: 'Choisir cette salle' }).click();
        await expect(page.getByText('Touchez un jour')).toBeVisible();
        await page.getByRole('button', { name: 'Mois suivant' }).click();

        await expect(dayButton(page, 15)).toBeDisabled();

        await dayButton(page, 3).click();
        await dayButton(page, 5).click();
        await expect(page.getByText('3 jours', { exact: true })).toBeVisible();

        // Au-delà de trois jours, le clic commence une nouvelle sélection.
        await dayButton(page, 8).click();
        await dayButton(page, 12).click();
        await expect(page.getByText('3 h', { exact: true })).toBeVisible();

        await page.getByRole('button', { name: /^Début/ }).click();
        await page.getByRole('button', { name: '18h', exact: true }).click();
        await page.getByRole('button', { name: '10', exact: true }).click();
        await expect(page.getByText('18h10', { exact: true }).first()).toBeVisible();
    });
});
