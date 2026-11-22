import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
    await page.route(/\/api\//, (route) => route.fulfill({ status: 401, json: {} }));
});

test('La page d’accueil s’adresse aux associations', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Les démarches de votre asso, au même endroit.');
    await expect(page.getByText('Réservé aux associations de Feytiat.')).toBeVisible();

    const hero = page.locator('section', { has: page.locator('#hero-title') });
    await expect(hero.getByRole('link', { name: 'Créer le compte de mon asso' })).toHaveAttribute('href', '/inscription');
    await expect(hero.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/connexion');
});

test('Les onglets présentent chaque module', async ({ page }) => {
    await page.goto('/');
    const tabs = page.getByRole('tablist', { name: 'Modules de l’espace associations' });

    await tabs.scrollIntoViewIfNeeded();
    await tabs.getByRole('tab', { name: /Salles/ }).click();

    await expect(tabs.getByRole('tab', { name: /Salles/ })).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByRole('tabpanel').getByRole('heading', { name: 'Réservez une salle' })).toBeVisible();
});

test('Les questions s’ouvrent au clic', async ({ page }) => {
    await page.goto('/');
    const answer = page.getByText('Dès que la mairie a vérifié l’inscription.', { exact: false });

    await expect(answer).toBeHidden();
    await page.getByText('Quand mon compte est-il actif ?').click();
    await expect(answer).toBeVisible();
});

test('Le menu mobile mène aux sections et à l’inscription', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
    const menu = page.locator('#landing-mobile-menu');
    await expect(menu.getByRole('link', { name: 'Créer un compte' })).toHaveAttribute('href', '/inscription');
    await menu.getByRole('link', { name: 'Questions' }).click();
    await expect(page.locator('#landing-mobile-menu')).toHaveCount(0);
});

test('Le site a un favicon', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('link[rel="icon"]').first()).toHaveAttribute('href', /icon/);
});
