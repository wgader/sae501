<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Entity\Association;
use App\Entity\User;
use Symfony\Component\HttpFoundation\File\UploadedFile;

/**
 * Photo de profil de l’association : vraie image uniquement, réservée aux membres, ancienne
 * image supprimée au remplacement.
 */
final class AssociationPhotoTest extends ControllerRouteTestCase
{
    /** PNG valide de 1 × 1 pixel. */
    private const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    private string $uploadDirectory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->uploadDirectory = (string) static::getContainer()->getParameter('app.image_directory');
    }

    public function testMemberUploadsReplacesAndRemovesThePhoto(): void
    {
        $this->authenticateMember();

        $this->upload($this->file('logo.png', base64_decode(self::PNG)));
        $this->assertResponseIsSuccessful();
        $first = $this->response()['logoUrl'];
        self::assertMatchesRegularExpression('#^/uploads/associations/[a-f0-9]{48}\.png$#', $first);
        self::assertFileExists($this->uploadDirectory.'/associations/'.basename($first));

        $this->upload($this->file('autre.png', base64_decode(self::PNG)));
        $second = $this->response()['logoUrl'];
        self::assertNotSame($first, $second);
        self::assertFileDoesNotExist($this->uploadDirectory.'/associations/'.basename($first));

        $this->client->request('DELETE', '/api/account/profile/photo', [], [], ['HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest']);
        $this->assertResponseIsSuccessful();
        self::assertNull($this->response()['logoUrl']);
        self::assertFileDoesNotExist($this->uploadDirectory.'/associations/'.basename($second));
    }

    public function testFileThatIsNotAnImageIsRefused(): void
    {
        $this->authenticateMember();

        $this->upload($this->file('logo.png', '<?php echo "pas une image"; ?>'));

        $this->assertResponseStatusCodeSame(422);
    }

    public function testAccountWithoutAssociationIsRefused(): void
    {
        $this->authenticateAsAdmin();

        $this->upload($this->file('logo.png', base64_decode(self::PNG)));

        $this->assertResponseStatusCodeSame(403);
    }

    public function testUploadsArePerAccountRateLimited(): void
    {
        $this->authenticateMember();

        for ($upload = 1; $upload <= 20; ++$upload) {
            $this->upload($this->file('logo.png', base64_decode(self::PNG)));
            $this->assertResponseIsSuccessful();
        }

        $this->upload($this->file('logo.png', base64_decode(self::PNG)));

        $this->assertResponseStatusCodeSame(429);
        self::assertTrue($this->client->getResponse()->headers->has('Retry-After'));
    }

    public function testUploadRequiresAuthentication(): void
    {
        $this->upload($this->file('logo.png', base64_decode(self::PNG)));

        $this->assertResponseStatusCodeSame(401);
    }

    private function authenticateMember(): void
    {
        $association = (new Association())->setNom('Club photo')->setStatut('VALIDATED');
        $user = (new User())
            ->setEmail('membre@example.test')
            ->setNom('Membre')
            ->setPrenom('Club')
            ->setTypeCompte('association')
            ->setRoles(['ROLE_ASSOCIATION'])
            ->setIsVerified(true);
        $association->addUser($user);
        $this->em->persist($association);
        $this->em->persist($user);
        $this->em->flush();
        $this->client->setServerParameter('HTTP_AUTHORIZATION', 'Bearer '.$this->jwtManager->create($user));
    }

    private function file(string $name, string $content): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'photo');
        file_put_contents($path, $content);

        return new UploadedFile($path, $name, null, null, true);
    }

    private function upload(UploadedFile $file): void
    {
        $this->client->request('POST', '/api/account/profile/photo', [], ['photo' => $file], ['HTTP_ACCEPT' => 'application/json', 'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest']);
    }

    /**
     * @return array<string, mixed>
     */
    private function response(): array
    {
        return json_decode((string) $this->client->getResponse()->getContent(), true, 512, \JSON_THROW_ON_ERROR);
    }
}
