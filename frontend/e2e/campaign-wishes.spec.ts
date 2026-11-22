import { expect, test, type Page } from '@playwright/test';

const association = {
    id: 12, email: 'asso@example.test', nom: 'Martin', prenom: 'Lou', roles: ['ROLE_ASSOCIATION'], typeCompte: 'association',
    nomAssociation: 'Club de Feytiat', logoUrl: null, modules: { subventions: true, materiel: true, salles: true, evenements: true },
};
const admin = { id: 1, email: 'admin@example.test', nom: 'Admin', prenom: 'Mairie', roles: ['ROLE_ADMIN'], typeCompte: 'mairie', nomAssociation: null, logoUrl: null, modules: null };

const campaign = {
    id: 7, seasonLabel: 'Saison 2027-2028', openingAt: '2026-11-01T08:00:00+01:00', closingAt: '2026-12-15T18:00:00+01:00',
    periodStart: '2027-09-01', periodEnd: '2028-06-30', resourceTypes: ['salle'], status: 'ACTIVE', createdAt: '2026-10-01T08:00:00+01:00', updatedAt: '2026-10-01T08:00:00+01:00',
};
const gym = { id: 3, nom: 'Gymnase municipal', capaciteMax: 80, adresse: 'Feytiat', description: '', imageUrl: null, isActive: true, accesPmr: true, equipementsInclus: [], horairesOuverture: { debut: '08:00', fin: '23:00' } };

const wish = (id: number, club: string, start: string, end: string, status = 'En attente d’arbitrage par la mairie') => ({
    id, type: 'RECURRENT', status, salle: { id: 3, nom: 'Gymnase municipal' }, dayOfWeek: 2, dayLabel: 'Mardi', startTime: start, endTime: end,
    frequency: 'weekly', frequencyLabel: 'Hebdomadaire', activity: `Entraînement ${club}`, audience: 'youth', audienceLabel: 'Jeunes (moins de 18 ans)',
    expectedAttendance: 24, decisionComment: null, association: { id: id, nom: club }, submittedAt: '2026-11-20T10:00:00+01:00',
});

async function signIn(page: Page, user: object, kind: 'association' | 'admin') {
    await page.addInitScript(([session, sessionKind]) => {
        localStorage.setItem('session', JSON.stringify({ kind: sessionKind, user: session }));
    }, [user, kind] as const);
}

test.describe('Vœux récurrents de la campagne', () => {
    test('L’association saisit, vérifie puis transmet ses vœux', async ({ page }) => {
        await signIn(page, association, 'association');
        let posted: unknown = null;
        await page.route(/\/api\//, async (route) => {
            const { pathname } = new URL(route.request().url());
            if (pathname === '/api/auth/session') return route.fulfill({ json: { user: association } });
            if (pathname === '/api/rooms') return route.fulfill({ json: [gym] });
            if (pathname === '/api/campaigns/current/requests') return route.fulfill({ json: { campaign, requests: [] } });
            if (pathname === '/api/campaigns/current/wishes' && route.request().method() === 'POST') {
                posted = route.request().postDataJSON();
                return route.fulfill({ status: 201, json: { id: 1, submittedAt: '2026-11-23T10:00:00+01:00', wishes: [wish(1, 'Club de Feytiat', '18:00', '20:00')] } });
            }
            if (pathname === '/api/campaigns/current/wishes') return route.fulfill({ json: { campaign, submissions: [] } });
            return route.fulfill({ json: [] });
        });

        await page.goto('/campagne');
        const wishCard = page.getByRole('group', { name: 'Vœu 1' });
        await wishCard.getByLabel('Salle').selectOption('3');
        await wishCard.getByLabel('Jour').selectOption('2');
        await wishCard.getByLabel('Début').fill('20:00');
        await wishCard.getByLabel('Fin').fill('19:00');

        // Scénario 4 : la fin avant le début est signalée et bloque le récapitulatif.
        await expect(wishCard.getByText('La fin doit être après le début.')).toBeVisible();
        await page.getByRole('button', { name: 'Vérifier mes vœux' }).click();
        await expect(page.getByRole('button', { name: 'Vérifier mes vœux' })).toBeDisabled();

        await wishCard.getByLabel('Début').fill('18:00');
        await wishCard.getByLabel('Fin').fill('20:00');
        await wishCard.getByLabel('Public').selectOption('youth');
        await wishCard.getByLabel('Effectif prévu').fill('24');
        await wishCard.getByLabel('Activité').fill('Entraînement de basket U13');
        await page.getByRole('button', { name: 'Vérifier mes vœux' }).click();

        await expect(page.getByRole('heading', { name: 'Vérifiez vos vœux' })).toBeVisible();
        await expect(page.getByRole('cell', { name: 'Gymnase municipal' })).toBeVisible();
        await page.getByRole('button', { name: 'Transmettre mes 1 vœu' }).click();

        await expect(page.getByText('Vœux transmis à la mairie')).toBeVisible();
        expect(posted).toMatchObject({ wishes: [{ salleId: 3, dayOfWeek: 2, startTime: '18:00', endTime: '20:00', expectedAttendance: 24 }] });
    });

    test('Une campagne fermée pendant la saisie bloque l’envoi', async ({ page }) => {
        await signIn(page, association, 'association');
        await page.route(/\/api\//, async (route) => {
            const { pathname } = new URL(route.request().url());
            if (pathname === '/api/auth/session') return route.fulfill({ json: { user: association } });
            if (pathname === '/api/rooms') return route.fulfill({ json: [gym] });
            if (pathname === '/api/campaigns/current/requests') return route.fulfill({ json: { campaign, requests: [] } });
            if (pathname === '/api/campaigns/current/wishes' && route.request().method() === 'POST') {
                return route.fulfill({ status: 403, json: { code: 'CAMPAIGN_CLOSED', message: 'La période de dépôt des vœux est terminée.' } });
            }
            if (pathname === '/api/campaigns/current/wishes') return route.fulfill({ json: { campaign, submissions: [] } });
            return route.fulfill({ json: [] });
        });

        await page.goto('/campagne');
        const wishCard = page.getByRole('group', { name: 'Vœu 1' });
        await wishCard.getByLabel('Salle').selectOption('3');
        await wishCard.getByLabel('Jour').selectOption('2');
        await wishCard.getByLabel('Public').selectOption('adults');
        await wishCard.getByLabel('Effectif prévu').fill('10');
        await wishCard.getByLabel('Activité').fill('Yoga');
        await page.getByRole('button', { name: 'Vérifier mes vœux' }).click();
        await page.getByRole('button', { name: 'Transmettre mes 1 vœu' }).click();

        await expect(page.getByText('La campagne est clôturée')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Vérifier mes vœux' })).toHaveCount(0);
    });

    test('La mairie voit dix associations sur le même créneau dans un seul accordéon', async ({ page }) => {
        await signIn(page, admin, 'admin');
        const clubs = Array.from({ length: 10 }, (_, i) => wish(i + 1, `Club ${i + 1}`, '18:00', i % 2 ? '20:00' : '19:30'));
        let accepted: unknown = null;
        await page.route(/\/api\//, async (route) => {
            const { pathname } = new URL(route.request().url());
            if (pathname === '/api/auth/session') return route.fulfill({ json: { user: admin } });
            if (pathname === '/api/admin/campaigns') return route.fulfill({ json: [campaign] });
            if (pathname === `/api/admin/campaigns/${campaign.id}/requests`) return route.fulfill({ json: { campaign, requests: [] } });
            if (pathname === `/api/admin/campaign-wishes/campaigns/${campaign.id}`) {
                return route.fulfill({ json: {
                    groups: [
                        { key: '3-2-18:00', salle: { id: 3, nom: 'Gymnase municipal', capaciteMax: 80 }, dayOfWeek: 2, dayLabel: 'Mardi', startTime: '18:00', endTime: '20:00', disputed: true, wishes: clubs },
                        { key: '3-3-10:00', salle: { id: 3, nom: 'Gymnase municipal', capaciteMax: 80 }, dayOfWeek: 3, dayLabel: 'Mercredi', startTime: '10:00', endTime: '11:00', disputed: false, wishes: [{ ...wish(20, 'Club seul', '10:00', '11:00'), dayOfWeek: 3, dayLabel: 'Mercredi' }] },
                    ],
                    counts: { total: 11, pending: 11, accepted: 0, refused: 0, disputed: 1 },
                } });
            }
            if (pathname === '/api/admin/campaign-wishes/4/accept') {
                accepted = route.request().postDataJSON();
                return route.fulfill({ json: { accepted: 4, refused: [1, 2, 3, 5, 6, 7, 8, 9, 10] } });
            }
            return route.fulfill({ json: [] });
        });

        await page.goto('/admin/campagnes');
        const slot = page.getByRole('button', { name: /Gymnase municipal Mardi · 18:00 – 20:00/ });
        await expect(slot).toContainText('10 vœux en concurrence');
        await expect(slot).toHaveAttribute('aria-expanded', 'false');

        await slot.click();
        await expect(slot).toHaveAttribute('aria-expanded', 'true');
        await expect(page.getByText('Entraînement Club 10')).toBeVisible();

        await page.getByRole('listitem').filter({ hasText: 'Entraînement Club 4' }).last().getByRole('button', { name: 'Attribuer' }).click();
        await expect(page.getByText('Refuser en même temps les')).toBeVisible();
        await page.getByRole('dialog').getByRole('button', { name: 'Attribuer' }).click();
        expect(accepted).toEqual({ refuseOthers: true });
    });
});
