<?php

namespace App\Tests\Controller;

use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;

final class ContactControllerTest extends ControllerRouteTestCase
{
    public function testContactMessageCanBeSentWithoutAuthentication(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer
            ->expects(self::once())
            ->method('send')
            ->with(self::callback(static function (Email $email): bool {
                return $email->getTo()[0]->getAddress() === 'contact@ville-feytiat.fr'
                    && $email->getReplyTo()[0]->getAddress() === 'association@example.fr'
                    && $email->getSubject() === '[Contact site] Question sur les salles'
                    && str_contains($email->getTextBody() ?? '', 'Pouvez-vous me renseigner ?');
            }));
        static::getContainer()->set(MailerInterface::class, $mailer);

        $this->requestJson('POST', '/api/contact', [
            'nom' => 'Association Feytiat',
            'email' => 'association@example.fr',
            'sujet' => 'Question sur les salles',
            'message' => 'Pouvez-vous me renseigner ?',
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['message' => 'Votre message a bien été envoyé.']);
    }

    public function testContactMessageRejectsInvalidEmail(): void
    {
        $mailer = $this->createMock(MailerInterface::class);
        $mailer->expects(self::never())->method('send');
        static::getContainer()->set(MailerInterface::class, $mailer);

        $this->requestJson('POST', '/api/contact', [
            'nom' => 'Association Feytiat',
            'email' => 'adresse invalide',
            'sujet' => 'Question',
            'message' => 'Voici une question de test.',
        ]);

        $this->assertResponseStatusCodeSame(422);
    }
}
