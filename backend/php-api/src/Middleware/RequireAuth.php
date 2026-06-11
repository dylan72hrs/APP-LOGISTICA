<?php

declare(strict_types=1);

namespace App\Middleware;

use App\Http\Response;

final class RequireAuth
{
    public function handle(): void
    {
        Response::json([
            'error' => [
                'code' => 'AUTH_NOT_IMPLEMENTED',
                'message' => 'Autenticacion real no implementada en esta etapa.',
            ],
        ], 501);
    }
}
