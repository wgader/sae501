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

const contact = { nom: 'Martin', prenom: 'Lou', email: 'lou@example.test', telephone: null };

const reservation = (id: number, nom: string, lignes: { id: number; designation: string; quantite: number; photo: boolean }[]) => ({
    id,
    statut: 'En attente',
    motifEvenement: 'Tournoi des jeunes',
    dateRetrait: '2026-12-12T09:00:00+01:00',
    dateRestitution: '2026-12-13T18:00:00+01:00',
    createdAt: '2026-11-20T10:00:00+01:00',
    updatedAt: null,
    noteInterne: null,
    association: { id: 10 + id, nom, contact },
    documents: [],
    lignes: lignes.map((line) => ({
        materielId: line.id,
        designation: line.designation,
        imagePath: line.photo ? `/uploads/materiel/${line.id}.svg` : null,
        quantite: line.quantite,
    })),
});

const page1 = {
    items: [
        reservation(1, 'Foot Club Nord', [
            { id: 1, designation: 'Barnum 3x3 m', quantite: 4, photo: true },
            { id: 2, designation: 'Table pliante', quantite: 12, photo: true },
            { id: 3, designation: 'Chaise', quantite: 60, photo: false },
            { id: 4, designation: 'Sono portable', quantite: 1, photo: true },
        ]),
        reservation(2, 'Chorale du Bourg', [{ id: 2, designation: 'Table pliante', quantite: 6, photo: true }]),
    ],
    page: 1,
    itemsPerPage: 10,
    totalItems: 2,
    counts: { pending: 2, validated: 0, refused: 0, total: 2 },
};

/** Photo de test : un aplat de couleur avec le numéro de l’équipement. */
const photo = (id: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="#${['5B8C85', 'C9A227', '7D5BA6', '2E6F95'][Number(id) % 4]}"/><text x="200" y="165" font-size="64" fill="white" text-anchor="middle" font-family="sans-serif">${id}</text></svg>`;

async function mockAdmin(page: Page) {
    await page.addInitScript((session) => {
        localStorage.setItem('session', JSON.stringify({ kind: 'admin', user: session }));
    }, admin);
    await page.route(/\/(api|uploads)\//, async (route) => {
        const { pathname } = new URL(route.request().url());
        const media = pathname.match(/^\/uploads\/materiel\/(\d+)\.svg$/);
        if (media) return route.fulfill({ contentType: 'image/svg+xml', body: photo(media[1]) });
        if (pathname === '/api/auth/session') return route.fulfill({ json: { user: admin } });
        if (pathname === '/api/admin/equipment/reservations') return route.fulfill({ json: page1 });
        return route.fulfill({ json: [] });
    });
}

test.describe('Demandes de matériel', () => {
    test('La liste montre les photos du matériel demandé', async ({ page }) => {
        await mockAdmin(page);
        await page.goto('/admin/materiel/demandes');

        const first = page.getByRole('link', { name: /Foot Club Nord/ });
        await expect(first).toHaveAttribute('href', '/admin/materiel/demandes/detail?id=1');
        await expect(first.getByText('4 × Barnum 3x3 m, 12 × Table pliante, 60 × Chaise, 1 × Sono portable')).toBeVisible();

        // Trois vignettes au plus, puis « +1 » pour le reste.
        const thumbnails = first.getByRole('list', { name: 'Matériel demandé' });
        await expect(thumbnails.getByRole('img')).toHaveCount(2);
        await expect(thumbnails.getByText('+1')).toBeVisible();
    });

    test('La vue cartes est retenue pour la visite suivante', async ({ page }) => {
        await mockAdmin(page);
        await page.goto('/admin/materiel/demandes');

        await page.getByRole('button', { name: 'Cartes' }).click();
        await expect(page.getByRole('button', { name: 'Cartes' })).toHaveAttribute('aria-pressed', 'true');
        const card = page.getByRole('link', { name: /Foot Club Nord/ });
        await expect(card.getByRole('img', { name: 'Barnum 3x3 m' })).toBeVisible();
        await expect(card.getByText('77 unités')).toBeVisible();
        await expect(card.getByText('+ 3 autres équipements')).toBeVisible();

        await page.reload();
        await expect(page.getByRole('button', { name: 'Cartes' })).toHaveAttribute('aria-pressed', 'true');
    });
});
