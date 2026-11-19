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

test('Le menu association affiche toujours Événements', async ({ page }) => {
    await mockGrantApi(page);
    await page.goto('/subventions');
    const menu = page.getByRole('navigation', { name: 'Navigation principale' });
    await expect(menu.getByRole('link', { name: 'Événements' })).toBeVisible();
});

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

    test('Un dossier transmis quitte les brouillons et passe en attente', async ({ page }) => {
        const readyDraft = {
            ...draft,
            intituleProjet: 'Festival associatif',
            description: 'Animer la commune.',
            publicCible: 'Habitants',
            dateDebutProjet: '2027-03-01',
            dateFinProjet: '2027-03-31',
            montantDemande: '500.00',
            bic: 'CMCIFRPP',
            iban: 'FR1420041010050500013M02606',
            budgetValide: true,
        };
        const document = { id: 9, typeDocument: 'Formulaire Cerfa', fichierUrl: '/api/documents/9/download', originalName: 'cerfa.pdf', size: 1024, mimeType: 'application/pdf', createdAt: null };
        let submitted = false;

        await page.addInitScript((session) => {
            localStorage.setItem('session', JSON.stringify({ kind: 'association', user: session }));
        }, user);
        await page.route(/\/api\//, async (route) => {
            const { pathname } = new URL(route.request().url());
            if (pathname === '/api/auth/session') return route.fulfill({ json: { user } });
            if (pathname === '/api/grants/drafts') return route.fulfill({ json: submitted ? [] : [readyDraft] });
            if (pathname === '/api/grants/3/documents') return route.fulfill({ json: [document] });
            if (pathname === '/api/grants/3/submit') {
                submitted = true;
                return route.fulfill({
                    json: { id: 3, statut: 'En attente', typeSubvention: 'Projet', intituleProjet: 'Festival associatif', montantDemande: '500.00', montantAccorde: null, observations: null, createdAt: null, updatedAt: '2026-11-19T10:00:00+01:00' },
                });
            }
            return route.fulfill({ json: [] });
        });

        await page.goto('/subventions');
        await page.getByRole('button', { name: /Festival associatif/ }).click();
        await page.getByRole('button', { name: 'Transmettre à la mairie' }).click();

        await expect(page.getByText('Votre dossier a été transmis à la mairie.')).toBeVisible();
        const sent = page.getByRole('region', { name: 'Demandes transmises' });
        await expect(sent.getByText('Festival associatif')).toBeVisible();
        await expect(sent.getByText('En attente')).toBeVisible();
        await expect(page.getByText('Aucun brouillon pour le moment.')).toBeVisible();
    });
});
