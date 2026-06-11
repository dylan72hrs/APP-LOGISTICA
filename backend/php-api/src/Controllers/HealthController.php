<?php

declare(strict_types=1);

namespace App\Controllers;

use App\Http\Response;

final class HealthController
{
    public function show(): void
    {
        Response::json([
            'status' => 'ok',
            'service' => 'app-logistica-api',
            'mode' => 'setup',
        ]);
    }
}
