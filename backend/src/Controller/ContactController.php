<?php

namespace App\Controller;

use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;
use Symfony\Component\Mailer\MailerInterface;
use Symfony\Component\Mime\Email;
use Symfony\Component\RateLimiter\RateLimiterFactory;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/contact')]
final class ContactController extends AbstractController
{
    private const CONTACT_EMAIL = 'contact@ville-feytiat.fr';

    #[Route('', name: 'api_contact_send', methods: ['POST'])]
    public function send(
        Request $request,
        MailerInterface $mailer,
        LoggerInterface $logger,
        #[Autowire(service: 'limiter.contact_message')]
        RateLimiterFactory $limiter,
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(
                ['message' => 'Le contenu du message est invalide.'],
                Response::HTTP_BAD_REQUEST
            );
        }

        $nom = is_string($data['nom'] ?? null) ? trim($data['nom']) : '';
        $email = is_string($data['email'] ?? null) ? trim($data['email']) : '';
        $sujet = is_string($data['sujet'] ?? null) ? trim($data['sujet']) : '';
        $message = is_string($data['message'] ?? null) ? trim($data['message']) : '';

        if (
            $nom === ''
            || mb_strlen($nom) > 120
            || $email === ''
            || mb_strlen($email) > 254
            || filter_var($email, FILTER_VALIDATE_EMAIL) === false
            || $sujet === ''
            || mb_strlen($sujet) > 150
            || preg_match('/[\r\n]/', $sujet) === 1
            || mb_strlen($message) < 10
            || mb_strlen($message) > 5000
        ) {
            return $this->json(
                ['message' => 'Vérifiez les champs du formulaire et réessayez.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $rateLimiter = $limiter->create($request->getClientIp());
        if (!$rateLimiter->consume(1)->isAccepted()) {
            return $this->json(
                ['message' => 'Trop de tentatives. Réessayez dans 15 minutes.'],
                Response::HTTP_TOO_MANY_REQUESTS
            );
        }

        $emailMessage = (new Email())
            ->from(self::CONTACT_EMAIL)
            ->to(self::CONTACT_EMAIL)
            ->replyTo($email)
            ->subject(sprintf('[Contact site] %s', $sujet))
            ->text(sprintf(
                "Nom : %s\nAdresse e-mail : %s\n\n%s",
                $nom,
                $email,
                $message
            ));

        try {
            $mailer->send($emailMessage);
        } catch (TransportExceptionInterface $exception) {
            $logger->error('Échec de livraison du formulaire de contact.', [
                'exception' => $exception,
            ]);

            return $this->json(
                ['message' => 'Votre message n’a pas pu être envoyé. Réessayez plus tard.'],
                Response::HTTP_SERVICE_UNAVAILABLE
            );
        }

        return $this->json(
            ['message' => 'Votre message a bien été envoyé.'],
            Response::HTTP_OK
        );
    }
}
