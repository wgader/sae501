import { test, expect } from '../fixtures/auth';

test.describe('Back-Office Administration', () => {

    // Connexion admin réelle avant chaque test via ta fixture
    test.beforeEach(async ({ page, loginAsAdmin }) => {
        await loginAsAdmin(page);
    });

    test('Navigation et gestion du matériel', async ({ page }) => {
        await page.goto('/admin/materiel');

        // Ouvre la modale
        const addButton = page.getByRole('button', { name: /ajouter un équipement/i });
        await addButton.click();

        const modal = page.locator('[role="dialog"], form').first();
        await expect(modal).toBeVisible({ timeout: 5000 });

        // Remplissage du formulaire
        await page.locator('#equipment-designation').fill('Vidéoprojecteur E2E');
        await page.locator('#equipment-stock').fill('5');

        // Ciblage exclusif du bouton de la modale pour éviter le conflit
        const submitButton = page.getByRole('button', { name: /enregistrer au catalogue/i });
        await submitButton.click();

        // Vérification de la création (toast ou liste)
        await expect(page.getByText('Vidéoprojecteur E2E').first()).toBeVisible();
    });

    test('Consultation des salles', async ({ page }) => {
        // Chemin confirmé par ton AdminDashboardPage
        await page.goto('/admin/salle');

        // Attente dynamique de Playwright sans networkidle
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('Consultation des inscriptions', async ({ page }) => {
        // Chemin corrigé : accès via le back-office comme indiqué dans ton dashboard
        await page.goto('/admin/inscription');

        // Vérifie simplement que la page charge son contenu
        await expect(page.locator('body')).not.toBeEmpty();
    });
});