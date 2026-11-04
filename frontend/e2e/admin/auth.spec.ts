import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
    test('Doit afficher une erreur en cas de mauvais identifiants', async ({ page }) => {
        await page.goto('/connexion');
        await page.fill('input[type="email"]', 'inconnu@feytiat.fr');
        await page.fill('input[type="password"]', 'mauvaispass');
        await page.click('button[type="submit"]');
        await expect(page.locator('.text-danger, .text-red-500').filter({ hasText: /[a-zA-Z]/ }).first()).toBeVisible();
    });

    test('Connexion réussie et redirection', async ({ page }) => {
        const adminEmail = process.env.TEST_ADMIN_EMAIL || '';
        const adminPassword = process.env.TEST_ADMIN_PASSWORD || '';

        await page.goto('/connexion');
        await page.fill('input[type="email"]', adminEmail);
        await page.fill('input[type="password"]', adminPassword);
        await page.click('button[type="submit"]');
        // Vérifie que l'on quitte bien la page de connexion
        await expect(page).not.toHaveURL(/\/connexion/);
    });

    test('Mot de passe oublié - envoi de demande', async ({ page }) => {
        const adminEmail = process.env.TEST_ADMIN_EMAIL || '';

        await page.goto('/mot-de-passe-oublie');
        await page.fill('input[type="email"]', adminEmail);
        await page.click('button[type="submit"]');
        await expect(page.locator('text=/email|réinitialisation|envoyé/i').first()).toBeVisible();
    });
});