<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    // ── Admin only guard ──────────────────────────────────────────────────────
    private function requireAdmin(Request $request): ?JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Admin access required.'], 403);
        }
        return null;
    }

    // GET /api/users
    public function index(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;
        // Update last_seen for this request
        $request->user()->update(['last_seen' => now()]);
        return response()->json(User::orderBy('name')->get()->map(fn($u) => $this->userPayload($u)));
    }

    // POST /api/users
    public function store(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'employee_id' => 'required|string|max:50',
            'email'       => 'nullable|email|unique:users,email',
            'password'    => ['required', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            'role'        => 'required|in:admin,officer,accounts',
            'location'    => 'nullable|string|max:255',
        ]);

        $empId = strtoupper(str_replace('-', '', $data['employee_id']));

        if (User::where('employee_id', $empId)->exists()) {
            return response()->json(['message' => 'Employee ID already exists.'], 422);
        }

        $user = User::create([
            'name'        => $data['name'],
            'employee_id' => $empId,
            'email'       => $data['email'] ?? null,
            'password'    => Hash::make($data['password']),
            'role'        => $data['role'],
            'location'    => $data['location'] ?? null,
            'is_active'   => true,
        ]);

        return response()->json($this->userPayload($user), 201);
    }

    // DELETE /api/users/{id}
    public function destroy(Request $request, $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $user = User::find($id);
        if (! $user) return response()->json(['message' => 'User not found.'], 404);
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User deleted successfully.']);
    }

    // PUT /api/users/{id}/toggle — activate / deactivate
    public function toggle(Request $request, $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $user = User::find($id);
        if (! $user) return response()->json(['message' => 'User not found.'], 404);
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot deactivate your own account.'], 422);
        }

        $user->update(['is_active' => ! $user->is_active]);
        if (! $user->is_active) $user->tokens()->delete();

        return response()->json($this->userPayload($user));
    }

    // PUT /api/users/{id}/manual-weight
    public function setManualWeightPermission(Request $request, $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $user = User::find($id);
        if (! $user) return response()->json(['message' => 'User not found.'], 404);

        $allow = $request->input('can_manual_weight');
        if (is_null($allow)) {
            return response()->json(['message' => 'can_manual_weight field is required.'], 422);
        }

        $user->update(['can_manual_weight' => (bool) $allow]);
        return response()->json($this->userPayload($user));
    }

    // PUT /api/users/{id}/password
    public function resetPassword(Request $request, $id): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $user = User::find($id);
        if (! $user) return response()->json(['message' => 'User not found.'], 404);

        $request->validate([
            'password' => ['required', Password::min(8)->letters()->mixedCase()->numbers()->symbols()]
        ]);
        $user->update(['password' => Hash::make($request->input('password'))]);
        $user->tokens()->delete();   // force re-login

        return response()->json(['message' => 'Password reset. User must log in again.']);
    }

    // GET /api/users/online — users seen in last 5 minutes
    public function online(Request $request): JsonResponse
    {
        if ($err = $this->requireAdmin($request)) return $err;

        $cutoff = now()->subMinutes(5);
        $users  = User::where('last_seen', '>=', $cutoff)->where('is_active', true)->get();
        return response()->json($users->map(fn($u) => $this->userPayload($u)));
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
            'is_active'         => (bool) $user->is_active,
            'can_manual_weight' => (bool) $user->can_manual_weight,
            'last_seen'         => $user->last_seen?->toIso8601String(),
            'is_online'         => $user->last_seen && $user->last_seen->gt(now()->subMinutes(5)),
        ];
    }
}
