<?php

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\DemandeSubvention;

final class GrantBankDetailsExposureTest extends ControllerRouteTestCase
{
    public function testGenericGrantResourceNeverReturnsBankDetails(): void
    {
        $this->authenticateAsAdmin();
        $association = (new Association())->setNom('Club')->setStatut('VALIDATED');
        $grant = (new DemandeSubvention())
            ->setAssociation($association)
            ->setIntituleProjet('Projet')
            ->setMontantDemande('10.00')
            ->setIban('FR7630006000011234567890189')
            ->setBic('AGRIFRPP');
        $this->em->persist($association);
        $this->em->persist($grant);
        $this->em->flush();

        foreach (['/api/demande_subventions', '/api/demande_subventions/'.$grant->getId()] as $uri) {
            $this->client->request('GET', $uri, [], [], ['HTTP_ACCEPT' => 'application/ld+json']);

            $this->assertResponseIsSuccessful();
            $content = (string) $this->client->getResponse()->getContent();
            self::assertStringNotContainsString('FR7630006000011234567890189', $content);
            self::assertStringNotContainsString('AGRIFRPP', $content);
        }
    }
}
