import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.route(/\/api\//, (route) => route.fulfill({ status: 401, json: {} }));
});

test('La page d’accueil s’adresse clairement aux associations', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Le guichet en ligne des associations de Feytiat.');
    await expect(page.getByText('Vous êtes un particulier ?')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Un espace pensé pour les associations, et seulement pour elles.' })).toBeVisible();

    const hero = page.locator('section', { has: page.locator('#hero-title') });
    await expect(hero.getByRole('link', { name: 'Inscrire mon association' })).toHaveAttribute('href', '/inscription');
    await expect(hero.getByRole('link', { name: 'J’ai déjà un compte' })).toHaveAttribute('href', '/connexion');
    await expect(page.getByRole('heading', { level: 3, name: 'Réserver une salle municipale' })).toBeVisible();
});

test('Les questions fréquentes s’ouvrent au clic', async ({ page }) => {
    await page.goto('/');
    const answer = page.getByText('La mairie vérifie chaque inscription avant de l’activer.', { exact: false });

    await expect(answer).toBeHidden();
    await page.getByText('Combien de temps faut-il pour que le compte soit actif ?').click();
    await expect(answer).toBeVisible();
});

test('Le menu mobile mène aux sections et à l’inscription', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    const menu = page.locator('#landing-mobile-menu');
    await expect(menu.getByRole('link', { name: 'Inscrire mon association' })).toHaveAttribute('href', '/inscription');
    await menu.getByRole('link', { name: 'Questions' }).click();
    await expect(page.locator('#landing-mobile-menu')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Les réponses avant de vous lancer.' })).toBeInViewport();
});
