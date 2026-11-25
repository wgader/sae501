<?php

declare(strict_types=1);

namespace App\Tests\Controller;

/**
 * Droits sur les réglages de contenu : l'agent des subventions gère ses justificatifs,
 * mais la FAQ et les textes légaux restent aux administrateurs.
 */
final class AdminContentAccessTest extends ControllerRouteTestCase
{
    public function testGrantAgentManagesGrantDocumentTypes(): void
    {
        $this->signInAgent(['ROLE_GESTION_SUBVENTION']);
        $this->client->request('GET', '/api/admin/content/grants/document-types');

        $this->assertResponseIsSuccessful();
    }

    public function testAgentCannotEditTheFaqOrLegalTexts(): void
    {
        $this->signInAgent(['ROLE_GESTION_SUBVENTION', 'ROLE_GESTION_SALLE', 'ROLE_GESTION_MATERIEL']);

        $this->client->request('GET', '/api/admin/content/faq');
        $this->assertResponseStatusCodeSame(403);

        $this->client->request('GET', '/api/admin/content/legal/cgu');
        $this->assertResponseStatusCodeSame(403);
    }

    public function testRoomAgentCannotReachGrantSettings(): void
    {
        $this->signInAgent(['ROLE_GESTION_SALLE']);
        $this->client->request('GET', '/api/admin/content/grants/document-types');

        $this->assertResponseStatusCodeSame(403);
    }
}
