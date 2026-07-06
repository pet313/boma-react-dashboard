<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Trust all proxies — required on Render (sits behind a load balancer)
        // Without this, APP_URL and redirects may use wrong protocol/host
        $middleware->trustProxies(at: '*');

        // DO NOT add EnsureFrontendRequestsAreStateful here.
        // The Android app uses Bearer token auth, not cookies/sessions.
        // That middleware causes session bootstrapping which fails on Render
        // when session config is wrong, returning HTML instead of JSON.
    })
    ->withExceptions(function (Exceptions $exceptions) {

        // Always return JSON for API routes — never HTML error pages
        $exceptions->render(function (\Illuminate\Validation\ValidationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => collect($e->errors())->flatten()->first() ?? 'Validation failed',
                    'errors'  => $e->errors(),
                ], 422);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated. Please log in again.'], 401);
            }
        });

        $exceptions->render(function (\Illuminate\Database\QueryException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                \Illuminate\Support\Facades\Log::error('DB error: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Database error. Check server logs.',
                ], 500);
            }
        });

        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => config('app.debug')
                        ? $e->getMessage()
                        : 'Server error. Check logs.',
                ], 500);
            }
        });

    })->create();
