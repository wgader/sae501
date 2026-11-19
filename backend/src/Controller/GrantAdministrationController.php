<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\DemandeSubvention;
use App\Entity\DemandeSubventionLigneBudget;
use App\Entity\DocumentJustificatif;
use App\Repository\DemandeSubventionRepository;
use App\Repository\DocumentJustificatifRepository;
use App\Service\GrantAdministrationService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\ExpressionLanguage\Expression;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Instruction des demandes de subvention par la mairie (administrateur ou agent du module).
 */
#[Route('/api/admin/grants')]
#[IsGranted(new Expression("is_granted('ROLE_ADMIN') or is_granted('ROLE_GESTION_SUBVENTION')"))]
final class GrantAdministrationController extends AbstractController
{
    private const FILTERS = [
        'pending' => GrantAdministrationService::PENDING_STATUSES,
        'validated' => ['Validée'],
        'refused' => ['Refusée'],
    ];

    public function __construct(
        private readonly DemandeSubventionRepository $grantRepository,
        private readonly DocumentJustificatifRepository $documentRepository,
        private readonly GrantAdministrationService $administrationService,
    ) {
    }

    #[Route('', name: 'admin_grant_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $filter = $request->query->get('status');
        $statuses = is_string($filter) && isset(self::FILTERS[$filter]) ? self::FILTERS[$filter] : null;

        $byStatus = $this->grantRepository->countByStatusForAdministration();
        $counts = ['all' => array_sum($byStatus)];
        foreach (self::FILTERS as $key => $filterStatuses) {
            $counts[$key] = array_sum(array_intersect_key($byStatus, array_flip($filterStatuses)));
        }

        return $this->json([
            'items' => array_map(
                fn (DemandeSubvention $grant): array => $this->serializeSummary($grant),
                $this->grantRepository->findForAdministration($statuses),
            ),
            'counts' => $counts,
        ]);
    }

    #[Route('/{id}', name: 'admin_grant_show', requirements: ['id' => '\d+'], methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $grant = $this->findSubmitted($id);
        if ($grant instanceof JsonResponse) {
            return $grant;
        }

        return $this->json($this->serializeDetail($grant));
    }

    #[Route('/{id}/decision', name: 'admin_grant_decision', requirements: ['id' => '\d+'], methods: ['PATCH'])]
    public function decide(int $id, Request $request): JsonResponse
    {
        $grant = $this->findSubmitted($id);
        if ($grant instanceof JsonResponse) {
            return $grant;
        }

        $payload = json_decode($request->getContent(), true);
        if (!is_array($payload) || !is_string($payload['status'] ?? null)) {
            return $this->json(['message' => 'La décision est obligatoire.'], Response::HTTP_BAD_REQUEST);
        }

        try {
            $this->administrationService->decide(
                $grant,
                $payload['status'],
                $payload['montantAccorde'] ?? null,
                $payload['message'] ?? null,
            );
        } catch (\InvalidArgumentException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\DomainException $exception) {
            return $this->json(['message' => $exception->getMessage()], Response::HTTP_CONFLICT);
        }

        return $this->json($this->serializeDetail($grant));
    }

    /** Un brouillon reste privé à l'association tant qu'il n'est pas transmis. */
    private function findSubmitted(int $id): DemandeSubvention|JsonResponse
    {
        $grant = $this->grantRepository->find($id);
        if (null === $grant || 'Brouillon' === $grant->getStatut()) {
            return $this->json(['message' => 'Demande de subvention introuvable.'], Response::HTTP_NOT_FOUND);
        }

        return $grant;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeSummary(DemandeSubvention $grant): array
    {
        $association = $grant->getAssociation();

        return [
            'id' => $grant->getId(),
            'statut' => $grant->getStatut(),
            'typeSubvention' => $grant->getTypeSubvention(),
            'intituleProjet' => $grant->getIntituleProjet(),
            'anneeExercice' => $grant->getAnneeExercice(),
            'montantDemande' => $grant->getMontantDemande(),
            'montantAccorde' => $grant->getMontantAccorde(),
            'createdAt' => $grant->getCreatedAt()?->format(\DateTimeInterface::ATOM),
            'updatedAt' => $grant->getUpdatedAt()?->format(\DateTimeInterface::ATOM),
            'association' => [
                'id' => $association?->getId(),
                'nom' => $association?->getNom(),
            ],
        ];
    }

    /**
     * Détail complet, coordonnées bancaires comprises, pour verser la subvention.
     *
     * @return array<string, mixed>
     */
    private function serializeDetail(DemandeSubvention $grant): array
    {
        $contact = $grant->getAssociation()?->getUsers()->first();
        $contact = false === $contact ? null : $contact;

        return array_merge($this->serializeSummary($grant), [
            'description' => $grant->getDescription(),
            'publicCible' => $grant->getPublicCible(),
            'dateDebutProjet' => $grant->getDateDebutProjet()?->format('Y-m-d'),
            'dateFinProjet' => $grant->getDateFinProjet()?->format('Y-m-d'),
            'bic' => $grant->getBic(),
            'iban' => $grant->getIban(),
            'observations' => $grant->getObservations(),
            'contact' => null === $contact ? null : [
                'nom' => $contact->getNom(),
                'prenom' => $contact->getPrenom(),
                'email' => $contact->getEmail(),
                'telephone' => $contact->getTelephone(),
            ],
            'lignesBudget' => array_map(
                static fn (DemandeSubventionLigneBudget $line): array => [
                    'type' => $line->getTypeLigne(),
                    'categorie' => $line->getCategorie(),
                    'intitule' => $line->getIntitule(),
                    'montant' => $line->getMontant(),
                ],
                $grant->getLignesBudget()->toArray(),
            ),
            'documents' => array_map(
                fn (DocumentJustificatif $document): array => $this->serializeDocument($document),
                $this->documentRepository->findByLinkedEntity('subvention', (int) $grant->getId()),
            ),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeDocument(DocumentJustificatif $document): array
    {
        $metadata = json_decode((string) $document->getDescription(), true);
        $metadata = is_array($metadata) ? $metadata : [];

        return [
            'id' => $document->getId(),
            'typeDocument' => $document->getTypeDocument(),
            'fichierUrl' => null !== $document->getId() ? '/api/documents/' . $document->getId() . '/download' : null,
            'size' => (int) ($metadata['size'] ?? 0),
            'originalName' => $metadata['originalName'] ?? $document->getTypeDocument(),
            'mimeType' => $metadata['mimeType'] ?? 'application/pdf',
            'createdAt' => $document->getCreatedAt()?->format(\DateTimeInterface::ATOM),
        ];
    }
}
