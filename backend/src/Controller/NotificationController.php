<?php

namespace App\Controller;

use App\Entity\Notification;
use App\Entity\User;
use App\Repository\NotificationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notifications')]
#[IsGranted('ROLE_USER')]
final class NotificationController extends AbstractController
{
    public function __construct(
        private readonly NotificationRepository $notificationRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('', name: 'api_notifications_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $page = max(1, $request->query->getInt('page', 1));
        $limit = min(50, max(1, $request->query->getInt('itemsPerPage', 20)));
        $items = $this->notificationRepository->findForUser($user, $page, $limit);

        return $this->json([
            'items' => array_map(self::serialize(...), $items),
            'page' => $page,
            'itemsPerPage' => $limit,
            'totalItems' => $this->notificationRepository->countForUser($user),
            'unreadCount' => $this->notificationRepository->countUnreadForUser($user),
        ]);
    }

    #[Route('/unread-count', name: 'api_notifications_unread_count', methods: ['GET'])]
    public function unreadCount(): JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        if ($user instanceof JsonResponse) {
            return $user;
        }

        return $this->json(['count' => $this->notificationRepository->countUnreadForUser($user)]);
    }

    #[Route('/{id<\d+>}/read', name: 'api_notification_read', methods: ['PATCH'])]
    public function read(int $id): JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $notification = $this->notificationRepository->findOneForUser($id, $user);
        if (!$notification instanceof Notification) {
            return $this->json(['message' => 'Notification introuvable.'], Response::HTTP_NOT_FOUND);
        }

        $notification->setReadAt(new \DateTimeImmutable());
        $this->entityManager->flush();

        return $this->json(self::serialize($notification));
    }

    #[Route('/read-all', name: 'api_notifications_read_all', methods: ['PATCH'])]
    public function readAll(): JsonResponse
    {
        $user = $this->getAuthenticatedUser();
        if ($user instanceof JsonResponse) {
            return $user;
        }

        $updated = $this->notificationRepository->markAllAsRead($user);
        return $this->json(['updated' => $updated, 'unreadCount' => 0]);
    }

    private function getAuthenticatedUser(): User|JsonResponse
    {
        $user = $this->getUser();
        return $user instanceof User
            ? $user
            : $this->json(['message' => 'Utilisateur non authentifié.'], Response::HTTP_UNAUTHORIZED);
    }

    /** @return array<string, mixed> */
    private static function serialize(Notification $notification): array
    {
        return [
            'id' => $notification->getId(),
            'title' => $notification->getTitle(),
            'message' => $notification->getMessage(),
            'type' => $notification->getType(),
            'event_id' => $notification->getEventId(),
            'read_at' => $notification->getReadAt()?->format(\DateTimeInterface::ATOM),
            'created_at' => $notification->getCreatedAt()->format(\DateTimeInterface::ATOM),
        ];
    }
}
