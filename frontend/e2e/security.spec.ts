import { test, expect } from './fixtures/auth';

/**
 * Protections vérifiées dans un vrai navigateur : session illisible par JavaScript, scripts
 * injectés bloqués par la CSP, lien de réinitialisation invalide refusé.
 */
test.describe('Sécurité du navigateur', () => {
    test('La session reste dans un cookie HttpOnly, jamais lisible par JavaScript', async ({ page, loginAsAdmin }) => {
        await loginAsAdmin(page);

        const storage = await page.evaluate(() => ({
            cookie: document.cookie,
            keys: Object.keys(localStorage),
            values: Object.values(localStorage).join(' '),
        }));
        expect(storage.cookie).not.toContain('sae501_session');
        expect(storage.keys).not.toContain('token');
        expect(storage.keys).not.toContain('admin_token');
        // Un JWT commence toujours par « eyJ » : aucun ne doit être stocké côté navigateur.
        expect(storage.values).not.toContain('eyJ');

        const cookies = await page.context().cookies();
        const session = cookies.find((cookie) => cookie.name === 'sae501_session');
        expect(session?.httpOnly).toBe(true);
        expect(session?.sameSite).toBe('Strict');
    });

    test('Un attribut HTML injecté ne peut pas exécuter de script', async ({ page }) => {
        await page.goto('/connexion');

        const executed = await page.evaluate(async () => {
            (window as Window & { injected?: boolean }).injected = false;
            const container = document.createElement('div');
            container.innerHTML = '<img src="data:x" onerror="window.injected = true">';
            document.body.appendChild(container);
            await new Promise((resolve) => setTimeout(resolve, 300));
            return (window as Window & { injected?: boolean }).injected;
        });

        expect(executed).toBe(false);
    });

    test('Un lien de réinitialisation inconnu est refusé', async ({ page }) => {
        await page.goto('/reinitialiser-mot-de-passe?token=' + '0'.repeat(64));
        const password = `Aa1${Date.now()}x`;
        await page.getByLabel('Nouveau mot de passe').fill(password);
        await page.getByLabel('Confirmer le mot de passe').fill(password);
        await page.getByRole('button', { name: /enregistrer le mot de passe/i }).click();

        await expect(page.getByRole('alert').filter({ hasText: 'invalide ou a expiré' })).toBeVisible();
    });
});
