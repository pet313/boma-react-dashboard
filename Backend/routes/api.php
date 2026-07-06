<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GrnController;
use App\Http\Controllers\Api\LivestockController;
use App\Http\Controllers\Api\MobController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| KMC Livestock GRN — API Routes  (v8 — MOB Closing + GRN Email)
|--------------------------------------------------------------------------
*/

// ── Public ────────────────────────────────────────────────────────────────
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login'])->name('login');
});

// ── Authenticated ─────────────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'throttle:120,1'])->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Suppliers
    Route::apiResource('suppliers', SupplierController::class);

    // MOBs — CRUD + Close + Retry Email
    Route::apiResource('mobs', MobController::class);
    Route::post('/mobs/{mob}/close',       [MobController::class, 'close']);        // Feature 1+2+3
    Route::post('/mobs/{mob}/retry-email', [MobController::class, 'retryEmail']);   // Feature 3 retry
    Route::post('/sync/mobs',              [MobController::class, 'sync']);

    // Livestock (nested under mob)
    Route::post('/mobs/{mob}/livestock',            [LivestockController::class, 'store']);
    Route::put('/mobs/{mob}/livestock/{animal}',    [LivestockController::class, 'update']);
    Route::delete('/mobs/{mob}/livestock/{animal}', [LivestockController::class, 'destroy']);

    // GRN — only works on CLOSED mobs
    Route::get('/mobs/{mob}/grn-data', [GrnController::class, 'data']);
    Route::get('/mobs/{mob}/grn',      [GrnController::class, 'generate']);

    // Users — static routes BEFORE parameterised to avoid shadowing
    Route::get('/users/online',             [UserController::class, 'online']);
    Route::get('/users',                    [UserController::class, 'index']);
    Route::post('/users',                   [UserController::class, 'store']);
    Route::put('/users/{id}/manual-weight', [UserController::class, 'setManualWeightPermission']);
    Route::put('/users/{id}/toggle',        [UserController::class, 'toggle']);
    Route::put('/users/{id}/password',      [UserController::class, 'resetPassword']);
    Route::delete('/users/{id}',            [UserController::class, 'destroy']);
});
