<?php

declare(strict_types=1);

namespace App\Tests\Controller;

final class PublicContentControllerTest extends ControllerRouteTestCase
{
    public function testFaqIsAvailableWithoutAuthentication(): void
    {
        $this->client->request('GET', '/api/public/faq');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            [
                'question' => 'Qui peut créer un compte ?',
                'answer' => 'Les associations de Feytiat, via leur président ou un membre du bureau. Les particuliers passent par le site de la ville.',
            ],
        ]);
    }

    public function testCguIsAvailableWithoutAuthentication(): void
    {
        $this->client->request('GET', '/api/public/legal/cgu');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'type' => 'cgu',
            'title' => "Conditions générales d'utilisation",
        ]);
    }

    public function testLegalMentionsAreAvailableWithoutAuthentication(): void
    {
        $this->client->request('GET', '/api/public/legal/mentions_legales');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains([
            'type' => 'mentions_legales',
            'title' => 'Mentions légales',
        ]);
    }
}
