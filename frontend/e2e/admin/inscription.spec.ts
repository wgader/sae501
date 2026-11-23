import { test, expect } from '../fixtures/auth';

test.beforeEach(async ({ page, loginAsAdmin }) => {
    await loginAsAdmin(page);
});

test.describe('Gestion des Inscriptions et Documents', () => {
    test('Traitement d\'une demande d\'inscription (Accepter/Refuser)', async ({ page }) => {
        await page.goto('/admin/inscription');

        await page.waitForSelector('ul li a[href*="/admin/inscription/"], [role="alert"], section p', { timeout: 15000 });
        await page.getByRole('button', { name: /en attente/i }).click();

        const firstLink = page.locator('a[href*="/admin/inscription/"]').first();
        await firstLink.waitFor({ state: 'visible', timeout: 15000 });
        await firstLink.click();

        await page.waitForSelector('article', { timeout: 10000 });

        // Regex simplifiée pour éviter le blocage sur l'apostrophe (l' vs l’)
        const acceptBtn = page.getByRole('button', { name: /accepter/i });
        await acceptBtn.waitFor({ state: 'attached', timeout: 10000 });
        await acceptBtn.evaluate((node) => node.scrollIntoView({ behavior: 'auto', block: 'center' }));
        await page.waitForTimeout(300);
        await acceptBtn.click({ force: true });

        const confirmBtn = page.getByRole('button', { name: /confirmer|valider|accepter/i }).last();
        await confirmBtn.waitFor({ state: 'attached', timeout: 5000 });
        await confirmBtn.evaluate((node) => node.scrollIntoView({ behavior: 'auto', block: 'center' }));
        await confirmBtn.click({ force: true });

        await expect(page.getByText(/inscription a bien été acceptée/i)).toBeVisible({ timeout: 10000 });
    });

    test('Ajout d\'un document justificatif à un dossier', async ({ page }) => {
        await page.goto('/admin/association/1/documents');

        await page.waitForSelector('button, [role="alert"]', { timeout: 10000 });

        const addBtn = page.getByRole('button', { name: /ajouter un document/i }).first();
        await addBtn.waitFor({ state: 'attached', timeout: 10000 });
        await addBtn.evaluate((node) => node.scrollIntoView({ behavior: 'auto', block: 'center' }));
        await page.waitForTimeout(300);
        await addBtn.click({ force: true });

        await page.waitForSelector('#doc-file-input', { timeout: 5000 });

        await page.locator('#doc-file-input').setInputFiles({
            name: 'statuts_feytiat.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4 test document'),
        });

        // Génération d'un nom unique avec timestamp
        const uniqueDocTitle = `Statuts mis à jour ${Date.now()}`;
        await page.locator('#doc-title-input').fill(uniqueDocTitle);

        const submitDocBtn = page.getByRole('button', { name: /ajouter au dossier/i });
        await submitDocBtn.waitFor({ state: 'attached', timeout: 5000 });
        await submitDocBtn.evaluate((node) => node.scrollIntoView({ behavior: 'auto', block: 'center' }));
        await submitDocBtn.click({ force: true });

        // Vérification ciblée sur l'élément unique nouvellement créé
        await expect(page.getByText(uniqueDocTitle)).toBeVisible({ timeout: 10000 });
    });
});