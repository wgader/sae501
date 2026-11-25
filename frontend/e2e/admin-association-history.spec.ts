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

const association = {
    id: 7,
    nom: 'Foot Club Nord',
    statut: 'VALIDATED',
    permissions: ['salles', 'materiel'],
    createdAt: '2024-01-10T10:00:00+01:00',
    contact: null,
    logoUrl: null,
    documents: [],
};

const history = {
    association: { id: 7, nom: 'Foot Club Nord' },
    totals: { roomReservationCount: 3, roomHoursGranted: 7.5, equipmentReservationCount: 1, equipmentQuantity: 4 },
    years: [
        {
            year: 2026,
            roomReservationCount: 2,
            roomHoursGranted: 5,
            equipmentReservationCount: 1,
            equipmentQuantity: 4,
            rooms: [{ id: 2, nom: 'Salle des fêtes', reservationCount: 2, hours: 5 }],
            equipment: [{ id: 9, designation: 'Barnum', reservationCount: 1, quantity: 4 }],
            attributions: [
                {
                    type: 'salle',
                    id: 31,
                    statut: 'Validée',
                    motifEvenement: 'Assemblée générale du club',
                    campagne: '2026-2027',
                    start: '2026-09-17T18:00:00+02:00',
                    end: '2026-09-17T20:30:00+02:00',
                    hours: 2.5,
                    salle: { id: 2, nom: 'Salle des fêtes' },
                },
                {
                    type: 'materiel',
                    id: 44,
                    statut: 'Matériel restitué',
                    motifEvenement: 'Tournoi des jeunes',
                    start: '2026-06-06T09:00:00+02:00',
                    end: '2026-06-07T18:00:00+02:00',
                    lignes: [{ materielId: 9, designation: 'Barnum', quantite: 4 }],
                },
            ],
        },
        {
            year: 2025,
            roomReservationCount: 1,
            roomHoursGranted: 2.5,
            equipmentReservationCount: 0,
            equipmentQuantity: 0,
            rooms: [{ id: 3, nom: 'Gymnase', reservationCount: 1, hours: 2.5 }],
            equipment: [],
            attributions: [
                {
                    type: 'salle',
                    id: 12,
                    statut: 'Clôturée',
                    motifEvenement: 'Entraînement hivernal',
                    campagne: null,
                    start: '2025-01-15T18:00:00+01:00',
                    end: '2025-01-15T20:30:00+01:00',
                    hours: 2.5,
                    salle: { id: 3, nom: 'Gymnase' },
                },
            ],
        },
    ],
};

async function mockAdmin(page: Page, historyStatus = 200) {
    await page.addInitScript((session) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'admin', user: session }));
    }, admin);
    await page.route(/\/api\//, async (route) => {
        const url = new URL(route.request().url());
        if (url.pathname === '/api/auth/session') return route.fulfill({ json: { user: admin } });
        if (url.pathname === '/api/admin/associations/7') return route.fulfill({ json: association });
        if (url.pathname === '/api/schedules/history') {
            // La mairie doit toujours désigner l’association consultée.
            expect(url.searchParams.get('asso_id')).toBe('7');
            return route.fulfill({ status: historyStatus, json: historyStatus === 200 ? history : { message: 'Erreur serveur' } });
        }
        return route.fulfill({ json: { items: [], totalItems: 0 } });
    });
}

test.describe('Fiche association · historique', () => {
    test('Présente le bilan de l’année et permet de changer d’année', async ({ page }) => {
        await mockAdmin(page);
        await page.goto('/admin/association/fiche/historique?id=7');

        await expect(page.getByRole('heading', { name: 'Historique du dossier' })).toBeVisible();
        await expect(page.getByRole('heading', { name: /2026\s*2 attributions renseignées/ })).toBeVisible();

        const rooms = page.getByRole('table', { name: 'Salles' });
        await expect(rooms.getByRole('row', { name: /Salle des fêtes\s*2\s*5 h/ })).toBeVisible();
        await expect(page.getByRole('table', { name: 'Matériel' }).getByRole('rowheader', { name: 'Barnum' })).toBeVisible();

        await expect(page.getByRole('heading', { name: 'Réservation · Salle des fêtes' })).toBeVisible();
        await expect(page.getByText('Assemblée générale du club')).toBeVisible();
        await expect(page.getByText('4 ×', { exact: false })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Pièces du dossier' }).first()).toHaveAttribute(
            'href',
            '/admin/association/fiche/historique/pieces-annexes?id=7&type=salle&requestId=31',
        );

        await page.getByLabel('Année').selectOption('2025');
        await expect(page.getByRole('heading', { name: /2025\s*1 attribution renseignée/ })).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Réservation · Gymnase' })).toBeVisible();
        await expect(page.getByText('Aucun matériel cette année.')).toBeVisible();
    });

    test('Signale une erreur de chargement', async ({ page }) => {
        await mockAdmin(page, 500);
        await page.goto('/admin/association/fiche/historique?id=7');

        await expect(page.getByRole('region', { name: 'Historique du dossier' }).getByText('Erreur serveur')).toBeVisible();
    });
});
