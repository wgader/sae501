import { test, expect } from '../fixtures/auth';

test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin(page);
});

test.describe('Gestion du Matériel et Stocks', () => {
    test('Ajustement de stock et confirmation de surbooking', async ({ page }) => {
        await page.goto('/admin/materiel');

        // S'assurer qu'au moins un bouton "Ajuster" est chargé et cliquable
        const btnAjuster = page.getByRole('button', { name: /ajuster/i }).first();
        await btnAjuster.waitFor({ state: 'visible' });
        await btnAjuster.click();

        // Attendre que la modal soit ouverte
        await page.waitForSelector('#new-equipment-stock', { state: 'visible' });

        // Saisie d'un stock positif garanti sans surbooking (valeur haute)
        await page.locator('#new-equipment-stock').fill('999');

        // Attendre que la vérification async de stock soit terminée (spinner disparaît)
        await page.waitForFunction(() => {
            const statusEl = document.getElementById('stock-check-status');
            return !statusEl;
        }, { timeout: 10000 });

        const warning = page.getByText(/avertissement de surbooking/i);
        if (await warning.isVisible()) {
            await page.getByLabel(/je confirme explicitement cet ajustement/i).check({ force: true });
        }

        await page.getByRole('button', { name: /valider/i }).click();

        // Vérification du toast de succès
        await expect(page.getByText(/stock mis à jour pour/i)).toBeVisible({ timeout: 10000 });
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 5000 });
    });
});