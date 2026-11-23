<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Campaign;
use App\Entity\CampaignWish;
use App\Repository\CampaignWishRepository;
use App\Service\CampaignWishService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Arbitrage des vœux récurrents par la mairie. Les vœux sont regroupés par créneau disputé :
 * même salle, même jour, horaires qui se chevauchent.
 */
#[Route('/api/admin/campaign-wishes')]
#[IsGranted('ROLE_GESTION_SALLE')]
final class CampaignWishAdministrationController extends AbstractController
{
    public const AUTO_REFUSAL = 'Créneau attribué à une autre association.';

    public function __construct(
        private readonly CampaignWishRepository $wishRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/campaigns/{id}', name: 'admin_campaign_wishes', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function list(Campaign $campaign): JsonResponse
    {
        $wishes = $this->wishRepository->findForCampaign($campaign);
        $groups = self::groupByDisputedSlot($wishes);

        $count = static fn (string $status): int => count(array_filter($wishes, static fn (CampaignWish $wish): bool => $wish->getStatus() === $status));

        return $this->json([
            'groups' => $groups,
            'counts' => [
                'total' => count($wishes),
                'pending' => $count(CampaignWish::STATUS_PENDING),
                'accepted' => $count(CampaignWish::STATUS_ACCEPTED),
                'refused' => $count(CampaignWish::STATUS_REFUSED),
                'disputed' => count(array_filter($groups, static fn (array $group): bool => $group['disputed'])),
            ],
        ]);
    }

    /**
     * Attribue le créneau. Avec refuseOthers, les vœux en attente sur le même créneau sont refusés
     * dans la même opération.
     */
    #[Route('/{id}/accept', name: 'admin_campaign_wish_accept', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function accept(CampaignWish $wish, Request $request): JsonResponse
    {
        if (!$wish->isPending()) {
            return $this->json(['message' => 'Ce vœu a déjà été arbitré.'], Response::HTTP_CONFLICT);
        }

        $overlapping = $this->wishRepository->findOverlapping($wish);
        foreach ($overlapping as $other) {
            if (CampaignWish::STATUS_ACCEPTED === $other->getStatus()) {
                return $this->json([
                    'message' => sprintf('Ce créneau est déjà attribué à %s.', $other->getSubmission()?->getAssociation()?->getNom()),
                ], Response::HTTP_CONFLICT);
            }
        }

        $wish->decide(CampaignWish::STATUS_ACCEPTED, null);
        $refused = [];
        if (true === ($this->payload($request)['refuseOthers'] ?? false)) {
            foreach ($overlapping as $other) {
                if ($other->isPending()) {
                    $other->decide(CampaignWish::STATUS_REFUSED, self::AUTO_REFUSAL);
                    $refused[] = $other->getId();
                }
            }
        }
        $this->entityManager->flush();

        return $this->json(['accepted' => $wish->getId(), 'refused' => $refused]);
    }

    #[Route('/{id}/refuse', name: 'admin_campaign_wish_refuse', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function refuse(CampaignWish $wish, Request $request): JsonResponse
    {
        if (!$wish->isPending()) {
            return $this->json(['message' => 'Ce vœu a déjà été arbitré.'], Response::HTTP_CONFLICT);
        }

        $comment = $this->payload($request)['comment'] ?? null;
        $comment = is_string($comment) ? trim($comment) : '';
        if ('' === $comment || mb_strlen($comment) > 1000) {
            return $this->json(['message' => 'Indiquez le motif du refus (1 000 caractères au plus).'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $wish->decide(CampaignWish::STATUS_REFUSED, $comment);
        $this->entityManager->flush();

        return $this->json(['refused' => [$wish->getId()]]);
    }

    /** Annule une décision : le vœu revient dans la file d'arbitrage. */
    #[Route('/{id}/reset', name: 'admin_campaign_wish_reset', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function reset(CampaignWish $wish): JsonResponse
    {
        $wish->decide(CampaignWish::STATUS_PENDING, null);
        $this->entityManager->flush();

        return $this->json(['pending' => [$wish->getId()]]);
    }

    /**
     * Regroupe les vœux (déjà triés par salle, jour, heure) en créneaux : un groupe réunit les
     * vœux d'une même salle et d'un même jour dont les horaires se chevauchent de proche en proche.
     *
     * @param list<CampaignWish> $wishes
     *
     * @return list<array<string, mixed>>
     */
    public static function groupByDisputedSlot(array $wishes): array
    {
        $groups = [];
        $current = null;
        foreach ($wishes as $wish) {
            $sameDay = null !== $current
                && $current['salleId'] === $wish->getSalle()?->getId()
                && $current['dayOfWeek'] === $wish->getDayOfWeek();
            if ($sameDay && $wish->getStartTime() < $current['endTime']) {
                $current['endTime'] = max($current['endTime'], $wish->getEndTime());
                $current['wishes'][] = $wish;
                continue;
            }
            if (null !== $current) {
                $groups[] = $current;
            }
            $current = [
                'salleId' => $wish->getSalle()?->getId(),
                'dayOfWeek' => $wish->getDayOfWeek(),
                'startTime' => $wish->getStartTime(),
                'endTime' => $wish->getEndTime(),
                'wishes' => [$wish],
            ];
        }
        if (null !== $current) {
            $groups[] = $current;
        }

        return array_map(static function (array $group): array {
            /** @var list<CampaignWish> $members */
            $members = $group['wishes'];
            $first = $members[0];

            return [
                'key' => sprintf('%d-%d-%s', $group['salleId'], $group['dayOfWeek'], $group['startTime']),
                'salle' => ['id' => $group['salleId'], 'nom' => $first->getSalle()?->getNom(), 'capaciteMax' => $first->getSalle()?->getCapaciteMax()],
                'dayOfWeek' => $group['dayOfWeek'],
                'dayLabel' => CampaignWish::DAYS[$group['dayOfWeek']] ?? '',
                'startTime' => $group['startTime'],
                'endTime' => $group['endTime'],
                'disputed' => count($members) > 1,
                'wishes' => array_map(static fn (CampaignWish $wish): array => CampaignWishService::serializeWish($wish) + [
                    'association' => ['id' => $wish->getSubmission()?->getAssociation()?->getId(), 'nom' => $wish->getSubmission()?->getAssociation()?->getNom()],
                    'submittedAt' => $wish->getSubmission()?->getSubmittedAt()->format(\DateTimeInterface::ATOM),
                ], $members),
            ];
        }, $groups);
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Request $request): array
    {
        $payload = json_decode($request->getContent(), true);

        return is_array($payload) ? $payload : [];
    }
}
