import { expect, test } from '@playwright/test';

const admin = {
    id: 1,
    email: 'admin@example.test',
    nom: 'Admin',
    prenom: 'Mairie',
    roles: ['ROLE_ADMIN'],
    typeCompte: 'mairie',
    nomAssociation: null,
    logoUrl: null,
    modules: null,
};

const grant = {
    id: 4,
    statut: 'En attente',
    typeSubvention: 'Projet',
    intituleProjet: 'Festival associatif',
    anneeExercice: 2027,
    montantDemande: '500.00',
    montantAccorde: null,
    createdAt: '2026-11-18T10:00:00+01:00',
    updatedAt: '2026-11-18T10:00:00+01:00',
    association: { id: 2, nom: 'Club de Feytiat' },
    description: 'Animer la commune.',
    publicCible: 'Habitants',
    dateDebutProjet: '2027-03-01',
    dateFinProjet: '2027-03-31',
    bic: 'CMCIFRPP',
    iban: 'FR1420041010050500013M02606',
    observations: null,
    contact: { nom: 'Martin', prenom: 'Lou', email: 'asso@example.test', telephone: null },
    lignesBudget: [],
    documents: [],
};

test('La mairie accorde une subvention depuis la liste des demandes', async ({ page }) => {
    let decision: Record<string, unknown> | null = null;

    await page.addInitScript((session) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'admin', user: session }));
    }, admin);
    await page.route(/\/api\//, async (route) => {
        const { pathname } = new URL(route.request().url());
        if (pathname === '/api/auth/session') return route.fulfill({ json: { user: admin } });
        if (pathname === '/api/admin/grants') {
            return route.fulfill({ json: { items: [grant], counts: { all: 1, pending: 1, validated: 0, refused: 0 } } });
        }
        if (pathname === '/api/admin/grants/4') return route.fulfill({ json: grant });
        if (pathname === '/api/admin/grants/4/decision') {
            decision = route.request().postDataJSON() as Record<string, unknown>;
            return route.fulfill({ json: { ...grant, statut: 'Validée', montantAccorde: '400.00' } });
        }
        return route.fulfill({ json: [] });
    });

    await page.goto('/admin/subvention');
    await page.getByRole('link', { name: /Club de Feytiat/ }).click();

    await expect(page.getByText('FR14 2004 1010 0505 0001 3M02 606')).toBeVisible();
    await page.getByLabel('Montant accordé (€)').fill('400');
    await page.getByRole('button', { name: 'Accepter' }).click();
    await page.getByRole('button', { name: /Confirmer/ }).click();

    await expect(page.getByText('La subvention a été accordée.')).toBeVisible();
    expect(decision).toMatchObject({ status: 'Validée', montantAccorde: '400' });
});
