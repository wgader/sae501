import { expect, test, type Page } from '@playwright/test';

const user = {
    id: 12,
    email: 'asso@example.test',
    nom: 'Martin',
    prenom: 'Lou',
    roles: ['ROLE_ASSOCIATION'],
    typeCompte: 'association',
    nomAssociation: 'Club de Feytiat',
    logoUrl: null,
    modules: { subventions: true, materiel: true, salles: true, evenements: true },
};

const draft = {
    id: 3,
    statut: 'Brouillon',
    typeSubvention: 'Projet',
    intituleProjet: 'Demande de subvention',
    description: '',
    publicCible: '',
    dateDebutProjet: null,
    dateFinProjet: null,
    montantDemande: '0.00',
    bic: null,
    iban: null,
    anneeExercice: 2026,
    budgetValide: false,
    lignesBudget: [],
};

async function mockGrantApi(page: Page) {
    await page.addInitScript((session) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'association', user: session }));
    }, user);

    await page.route(/\/api\//, async (route) => {
        const { pathname } = new URL(route.request().url());
        if (pathname === '/api/auth/session') return route.fulfill({ json: { user } });
        if (pathname === '/api/grants' && route.request().method() === 'POST') return route.fulfill({ status: 201, json: draft });
        return route.fulfill({ json: [] });
    });
}

test.describe('Demande de subvention', () => {
    test('Une nouvelle demande démarre sans coordonnées bancaires', async ({ page }) => {
        await mockGrantApi(page);

        await page.goto('/subventions');
        await page.getByRole('button', { name: 'Nouvelle demande' }).click();

        await expect(page.getByRole('heading', { name: 'Votre demande' })).toBeVisible();
        await expect(page.getByText('Le BIC doit contenir')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Retour' })).toHaveCount(0);
    });

    test('Le RIB est contrôlé avant de passer aux pièces justificatives', async ({ page }) => {
        await mockGrantApi(page);

        await page.goto('/subventions');
        await page.getByRole('button', { name: 'Nouvelle demande' }).click();
        await page.getByRole('button', { name: 'Continuer' }).click();

        await expect(page.getByText('Le BIC est obligatoire.')).toBeVisible();
        await expect(page.getByText('L’IBAN est obligatoire.')).toBeVisible();
    });
});
