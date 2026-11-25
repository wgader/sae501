import { expect, test, type Page } from '@playwright/test';

const now = new Date();
const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
const monthKey = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(nextMonth);

const EQUIPMENT = {
    id: 5,
    designation: 'Barnum pliant',
    categorie: 'barnums',
    referenceInterne: null,
    description: 'Barnum renforcé.',
    consignesUtilisation: null,
    stockTotal: 2,
    maxConsecutiveDays: 3,
    isArchived: false,
    statut: 'Disponible',
    imagePath: null,
    createdAt: null,
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

type DeskSettings = { deskOpening: string; deskClosing: string; pickupLocation: string | null; maxQuantityPerRequest: number | null };
const DEFAULT_DESK: DeskSettings = { deskOpening: '08:00', deskClosing: '19:00', pickupLocation: null, maxQuantityPerRequest: null };

async function mockApi(page: Page, desk: DeskSettings = DEFAULT_DESK) {
    await page.addInitScript((user) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'association', user }));
    }, USER);

    await page.route(/\/api\//, async (route) => {
        const { pathname } = new URL(route.request().url());
        const json = (body: unknown) => route.fulfill({ json: body });

        if (pathname === '/api/auth/session') return json({ user: USER });
        if (pathname === '/api/equipment') return json([EQUIPMENT]);
        if (pathname === '/api/equipment/5/occupancy') {
            return json({
                stockTotal: 2,
                maxConsecutiveDays: 3,
                lastDay: '2099-12-31',
                ...desk,
                reservations: [
                    { start: `${monthKey}-15T09:00:00`, end: `${monthKey}-15T17:00:00`, quantite: 2 },
                    { start: `${monthKey}-20T09:00:00`, end: `${monthKey}-20T17:00:00`, quantite: 1 },
                ],
            });
        }
        if (pathname === '/api/equipment/availability') {
            return json({ start: '', end: '', items: [{ ...EQUIPMENT, stockEngage: 1, stockDisponible: 1 }] });
        }
        return json([]);
    });
}

const dayButton = (page: Page, day: number) => page.getByRole('button', { name: new RegExp(` ${day} ${monthLabel}, `) });

test.describe('Réservation de matériel', () => {
    test('Le calendrier respecte le stock et la durée fixée par la mairie', async ({ page }) => {
        await mockApi(page);
        await page.goto('/materiel/reserver?id=5');
        await expect(page.getByRole('heading', { name: 'Barnum pliant' })).toBeVisible();
        await expect(page.getByText('3 jours d’affilée maximum')).toBeVisible();
        await page.getByRole('button', { name: 'Mois suivant' }).click();

        await expect(dayButton(page, 15)).toBeDisabled();
        await expect(page.getByRole('button', { name: new RegExp(` 20 ${monthLabel}, stock limité`) })).toBeEnabled();

        await dayButton(page, 3).click();
        await dayButton(page, 5).click();
        await expect(page.getByText('3 jours', { exact: true })).toBeVisible();

        // Au-delà de trois jours, le clic recommence la sélection au lieu d'allonger la période.
        await dayButton(page, 8).click();
        await dayButton(page, 12).click();
        await expect(page.getByText('3 h', { exact: true })).toBeVisible();

        await expect(page.getByText('1 disponible sur cette période')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Augmenter la quantité' })).toBeDisabled();
        await expect(page.getByRole('button', { name: 'Valider la demande' })).toBeDisabled();
    });

    test('Les horaires, le lieu et la quantité suivent les réglages de la mairie', async ({ page }) => {
        await mockApi(page, { deskOpening: '09:00', deskClosing: '12:00', pickupLocation: 'Centre technique municipal', maxQuantityPerRequest: 1 });
        await page.goto('/materiel/reserver?id=5');

        await expect(page.getByText('Service de prêt ouvert de 09h00 à 12h00 · Centre technique municipal')).toBeVisible();
        await page.getByRole('button', { name: 'Mois suivant' }).click();
        await dayButton(page, 3).click();
        await dayButton(page, 4).click();

        // Le créneau proposé reste dans les horaires du service : retrait à l'ouverture, restitution à la fermeture.
        const recap = page.getByRole('complementary').filter({ hasText: 'Récapitulatif' });
        await expect(recap.getByText(/à 09h00$/)).toBeVisible();
        await expect(recap.getByText(/à 12h00$/)).toBeVisible();
    });
});
