<?php

namespace App\Security;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Security\Core\Exception\AuthenticationException;
use Symfony\Component\Security\Http\Authentication\AuthenticationFailureHandlerInterface;

final class AdminAuthenticationFailureHandler implements AuthenticationFailureHandlerInterface
{
    public function onAuthenticationFailure(Request $request, AuthenticationException $exception): Response
    {
        $message = $exception->getMessageKey();

        if ($exception->getPrevious() instanceof AuthenticationException) {
            $message = $exception->getPrevious()->getMessageKey();
        }

        return new JsonResponse(['message' => $message], Response::HTTP_UNAUTHORIZED);
    }
}
