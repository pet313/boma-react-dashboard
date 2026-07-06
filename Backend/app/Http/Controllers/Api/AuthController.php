<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/auth/login
     * The UPPER(REPLACE(...)) raw query was triggering PostgreSQL's
     * "cached plan must not change result type" error after column changes.
     * Fix: fetch by exact employee_id using a parameterised Eloquent query,
     * then normalise in PHP — no raw SQL needed.
     */
    public function login(Request $request): JsonResponse
    {
        if (empty($request->input('employee_id')) || empty($request->input('password'))) {
            return response()->json([
                'message' => 'employee_id and password are required.',
            ], 422);
        }

        // Normalise in PHP — strip hyphens, uppercase
        $empId = strtoupper(str_replace('-', '', trim($request->input('employee_id'))));

        $user = User::where('employee_id', $empId)->first();
        if (! $user) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if ($user->isLocked()) {
            $mins = now()->diffInMinutes($user->locked_until);
            return response()->json([
                'message' => "Account locked. Try again in $mins minutes.",
            ], 403);
        }

        if (! Hash::check($request->input('password'), $user->password)) {
            // Defensive: Only increment if column exists
            if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'failed_attempts')) {
                $user->increment('failed_attempts');
                if ($user->failed_attempts >= 5) {
                    $user->update(['locked_until' => now()->addMinutes(30)]);
                    return response()->json([
                        'message' => 'Too many failed attempts. Account locked for 30 minutes.',
                    ], 403);
                }
            }

            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'Your account has been deactivated. Contact your administrator.',
            ], 403);
        }

        // Revoke all previous tokens (one active session at a time)
        $user->tokens()->delete();

        // Issue a 30-day Sanctum token
        $token = $user->createToken('kmc-app', ['*'], now()->addDays(30))->plainTextToken;

        $user->touchLastSeen();

        return response()->json([
            'token' => $token,
            'user'  => $this->userPayload($user),
        ], 200);
    }

    /**
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $request->user()->touchLastSeen();
        return response()->json($this->userPayload($request->user()));
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private function userPayload(User $user): array
    {
        return [
            'id'                => $user->id,
            'name'              => $user->name,
            'employee_id'       => str_replace('-', '', $user->employee_id),
            'email'             => $user->email ?? '',
            'role'              => $user->role,
            'location'          => $user->location,
            'can_manual_weight' => (bool) $user->can_manual_weight,
            'is_active'         => (bool) $user->is_active,
        ];
    }
}
