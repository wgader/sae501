<?php

declare(strict_types=1);

namespace App\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Crée un compte administrateur de la mairie sur un serveur sans fixtures (préproduction, production).
 *
 * Le mot de passe est uniquement saisi au clavier, masqué : il n’apparaît jamais dans les arguments,
 * l’historique du shell, les variables d’environnement ou les logs.
 */
#[AsCommand(
    name: 'app:create-admin',
    description: 'Crée un compte administrateur (ROLE_ADMIN) ; le mot de passe est demandé de façon masquée.'
)]
final class CreateAdminCommand extends Command
{
    public const MIN_PASSWORD_LENGTH = 12;

    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly ValidatorInterface $validator,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Adresse e-mail de connexion')
            ->addOption('prenom', null, InputOption::VALUE_REQUIRED, 'Prénom', 'Administrateur')
            ->addOption('nom', null, InputOption::VALUE_REQUIRED, 'Nom', 'Mairie');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        if (!$input->isInteractive()) {
            $io->error('Cette commande doit être lancée dans un terminal interactif (sans -n) pour saisir le mot de passe.');

            return Command::FAILURE;
        }

        $email = mb_strtolower(trim((string) $input->getArgument('email')));
        if ($this->entityManager->getRepository(User::class)->findOneBy(['email' => $email]) instanceof User) {
            $io->error('Un compte existe déjà avec cette adresse e-mail.');

            return Command::FAILURE;
        }

        $password = (string) $io->askHidden('Mot de passe ('.self::MIN_PASSWORD_LENGTH.' caractères minimum, majuscule, minuscule et chiffre)');
        $passwordErrors = $this->validator->validate($password, self::passwordConstraints());
        if (\count($passwordErrors) > 0) {
            $io->error((string) $passwordErrors->get(0)->getMessage());

            return Command::FAILURE;
        }
        if ($password !== (string) $io->askHidden('Confirmer le mot de passe')) {
            $io->error('Les deux mots de passe ne correspondent pas.');

            return Command::FAILURE;
        }

        $user = (new User())
            ->setEmail($email)
            ->setPrenom((string) $input->getOption('prenom'))
            ->setNom((string) $input->getOption('nom'))
            ->setTypeCompte('mairie')
            ->setRoles(['ROLE_ADMIN'])
            ->setIsVerified(true)
            ->setCguValidateAt(new \DateTimeImmutable());

        $userErrors = $this->validator->validate($user);
        if (\count($userErrors) > 0) {
            $io->error((string) $userErrors->get(0)->getMessage());

            return Command::FAILURE;
        }

        $user->setPassword($this->passwordHasher->hashPassword($user, $password));
        $this->entityManager->persist($user);
        $this->entityManager->flush();

        $io->success(\sprintf('Compte administrateur créé pour %s.', $email));

        return Command::SUCCESS;
    }

    /**
     * @return list<Constraint>
     */
    private static function passwordConstraints(): array
    {
        return [
            new Assert\NotBlank(message: 'Le mot de passe est obligatoire.'),
            new Assert\Length(
                min: self::MIN_PASSWORD_LENGTH,
                minMessage: 'Le mot de passe doit contenir au moins {{ limit }} caractères.',
            ),
            new Assert\Regex(pattern: '/[A-Z]/', message: 'Le mot de passe doit contenir au moins une majuscule.'),
            new Assert\Regex(pattern: '/[a-z]/', message: 'Le mot de passe doit contenir au moins une minuscule.'),
            new Assert\Regex(pattern: '/[0-9]/', message: 'Le mot de passe doit contenir au moins un chiffre.'),
        ];
    }
}
