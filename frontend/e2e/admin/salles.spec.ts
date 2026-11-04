import { test, expect } from '../fixtures/auth';

test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin(page);
});

test('Création d\'une nouvelle salle municipale', async ({ page }) => {
    await page.goto('/admin/salle');

    // Déplier le formulaire
    await page.getByRole('button', { name: /ajouter une salle/i }).click();

    // Remplissage avec une adresse valide
    await page.getByLabel(/nom de la salle/i).fill('Salle Polyvalente Nord');
    await page.getByLabel(/adresse/i).fill('12 Rue de la Mairie, 87220 Feytiat');
    await page.getByLabel(/capacité maximale/i).fill('150');

    await page.getByRole('button', { name: /créer la salle/i }).click();

    // Confirmation de création
    await expect(page.getByText('La salle a été créée avec succès.')).toBeVisible();

    // Correctif : cibler le premier titre de salle correspondant
    await expect(page.getByRole('heading', { name: 'Salle Polyvalente Nord' }).first()).toBeVisible();
});