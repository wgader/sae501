<?php

declare(strict_types=1);

namespace App\Tests\Command;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Tools\SchemaTool;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Bundle\FrameworkBundle\Test\KernelTestCase;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Tester\CommandTester;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Création du premier administrateur sur un serveur sans fixtures (app:create-admin).
 */
final class CreateAdminCommandTest extends KernelTestCase
{
    private EntityManagerInterface $em;
    private CommandTester $tester;
    /** Mot de passe conforme généré à chaque test : aucune valeur fixe dans le dépôt. */
    private string $password;

    protected function setUp(): void
    {
        $kernel = self::bootKernel();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);

        $schemaTool = new SchemaTool($this->em);
        $metadata = $this->em->getMetadataFactory()->getAllMetadata();
        $schemaTool->dropSchema($metadata);
        $schemaTool->createSchema($metadata);

        $this->tester = new CommandTester((new Application($kernel))->find('app:create-admin'));
        $this->password = self::randomPassword();
    }

    /**
     * Mot de passe aléatoire de 19 caractères avec majuscule, minuscule et chiffre.
     */
    private static function randomPassword(): string
    {
        return 'Qz7'.bin2hex(random_bytes(8));
    }

    public function testCreatesAVerifiedTownHallAdministrator(): void
    {
        $this->tester->setInputs([$this->password, $this->password]);

        $status = $this->tester->execute(['email' => '  Maire@Feytiat.FR ', '--prenom' => 'Claire', '--nom' => 'Martin']);

        self::assertSame(Command::SUCCESS, $status);
        $user = $this->em->getRepository(User::class)->findOneBy(['email' => 'maire@feytiat.fr']);
        self::assertInstanceOf(User::class, $user);
        self::assertContains('ROLE_ADMIN', $user->getRoles());
        self::assertSame('mairie', $user->getTypeCompte());
        self::assertSame('Claire', $user->getPrenom());
        self::assertTrue($user->isVerified());
        self::assertNotNull($user->getCguValidateAt());

        $hasher = static::getContainer()->get(UserPasswordHasherInterface::class);
        self::assertTrue($hasher->isPasswordValid($user, $this->password));
        self::assertStringNotContainsString($this->password, (string) $user->getPassword());
        self::assertStringNotContainsString($this->password, $this->tester->getDisplay());
    }

    public function testRefusesAnExistingEmail(): void
    {
        $this->tester->setInputs([$this->password, $this->password]);
        $this->tester->execute(['email' => 'maire@feytiat.fr']);

        $this->tester->setInputs([$this->password, $this->password]);
        $status = $this->tester->execute(['email' => 'MAIRE@feytiat.fr']);

        self::assertSame(Command::FAILURE, $status);
        self::assertStringContainsString('existe déjà', $this->tester->getDisplay());
        self::assertSame(1, $this->em->getRepository(User::class)->count([]));
    }

    /**
     * Chaque cas dérive un mot de passe faible du mot de passe aléatoire.
     *
     * @return iterable<string, array{\Closure(string): string, string}>
     */
    public static function weakPasswordProvider(): iterable
    {
        yield 'trop court' => [static fn (string $p): string => substr($p, 0, 11), 'au moins 12 caractères'];
        yield 'sans majuscule' => [static fn (string $p): string => strtolower($p), 'une majuscule'];
        yield 'sans minuscule' => [static fn (string $p): string => strtoupper($p), 'une minuscule'];
        yield 'sans chiffre' => [static fn (string $p): string => 'Qz'.str_repeat('x', 12), 'un chiffre'];
    }

    /**
     * @param \Closure(string): string $weaken
     */
    #[\PHPUnit\Framework\Attributes\DataProvider('weakPasswordProvider')]
    public function testRefusesAWeakPassword(\Closure $weaken, string $expectedMessage): void
    {
        $password = $weaken($this->password);
        $this->tester->setInputs([$password, $password]);

        $status = $this->tester->execute(['email' => 'maire@feytiat.fr']);

        self::assertSame(Command::FAILURE, $status);
        self::assertStringContainsString($expectedMessage, $this->tester->getDisplay());
        self::assertSame(0, $this->em->getRepository(User::class)->count([]));
    }

    public function testRefusesMismatchingConfirmation(): void
    {
        $this->tester->setInputs([$this->password, $this->password.'x']);

        $status = $this->tester->execute(['email' => 'maire@feytiat.fr']);

        self::assertSame(Command::FAILURE, $status);
        self::assertStringContainsString('ne correspondent pas', $this->tester->getDisplay());
        self::assertSame(0, $this->em->getRepository(User::class)->count([]));
    }

    public function testRefusesAnInvalidEmail(): void
    {
        $this->tester->setInputs([$this->password, $this->password]);

        $status = $this->tester->execute(['email' => 'pas-un-email']);

        self::assertSame(Command::FAILURE, $status);
        self::assertSame(0, $this->em->getRepository(User::class)->count([]));
    }

    public function testRefusesNonInteractiveMode(): void
    {
        $status = $this->tester->execute(['email' => 'maire@feytiat.fr'], ['interactive' => false]);

        self::assertSame(Command::FAILURE, $status);
        self::assertStringContainsString('terminal interactif', $this->tester->getDisplay());
        self::assertSame(0, $this->em->getRepository(User::class)->count([]));
    }
}
