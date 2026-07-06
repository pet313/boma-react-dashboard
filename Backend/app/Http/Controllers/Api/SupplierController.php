<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Supplier::query();
        $role = $request->user()?->role;

        // Non-admins only see active suppliers
        if ($role !== 'admin') {
            $query->where('is_active', true);
        }

        if ($request->filled('search')) {
            $s = trim($request->search);
            $query->where(function ($q) use ($s) {
                $q->where('name',       'like', "%{$s}%")
                  ->orWhere('farmer_no','like', "%{$s}%")
                  ->orWhere('id_number','like', "%{$s}%")
                  ->orWhere('phone',    'like', "%{$s}%");
            });
        }

        // Support active/inactive filter for admin
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        // Only admin and accounts can register new suppliers
        if (! in_array($request->user()?->role, ['admin', 'accounts'])) {
            return response()->json(['message' => 'Only admin or accounts staff can register suppliers.'], 403);
        }

        $data = $request->validate([
            'farmer_no'    => ['nullable','string','max:20', Rule::unique('suppliers', 'farmer_no')],
            'name'         => ['required','string','max:255'],
            'id_number'    => ['required','string','max:20', Rule::unique('suppliers', 'id_number')],
            'phone'        => ['required','string','max:20'],
            'email'        => ['nullable','email','max:255'],
            'location'     => ['required','string','max:255'],
            'bank_name'    => ['nullable','string','max:255'],
            'bank_account' => ['nullable','string','max:100'],
            'kra_pin'      => ['nullable','string','max:20'],
        ]);

        $supplier = Supplier::create($data);

        return response()->json($supplier, 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json($supplier);
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        if (! in_array($request->user()?->role, ['admin', 'accounts'])) {
            return response()->json(['message' => 'Only admin or accounts staff can update suppliers.'], 403);
        }

        $data = $request->validate([
            'name'         => ['sometimes','string','max:255'],
            'phone'        => ['sometimes','string','max:20'],
            'email'        => ['nullable','email','max:255'],
            'location'     => ['sometimes','string','max:255'],
            'bank_name'    => ['nullable','string','max:255'],
            'bank_account' => ['nullable','string','max:100'],
            'kra_pin'      => ['nullable','string','max:20'],
            'id_number'    => ['sometimes','string','max:20', Rule::unique('suppliers', 'id_number')->ignore($supplier->id)],
            'farmer_no'    => ['nullable','string','max:20', Rule::unique('suppliers', 'farmer_no')->ignore($supplier->id)],
            'is_active'    => ['sometimes','boolean'],
        ]);

        $supplier->update($data);

        return response()->json($supplier->fresh());
    }

    /**
     * Soft-deactivate by default; hard-delete only when the supplier has no MOBs.
     */
    public function destroy(Request $request, $id): JsonResponse
    {
        if ($request->user()?->role !== 'admin') {
            return response()->json(['message' => 'Only admins can delete suppliers.'], 403);
        }

        $supplier = Supplier::withCount('mobs')->find($id);

        if (! $supplier) {
            return response()->json(['message' => 'Supplier not found.'], 404);
        }

        // If the supplier has associated MOBs, soft-deactivate instead of deleting
        if ($supplier->mobs_count > 0) {
            $supplier->update(['is_active' => false]);

            return response()->json([
                'message' => 'Supplier has existing MOBs and has been deactivated instead of deleted.',
            ]);
        }

        $supplier->delete();

        return response()->json(['message' => 'Supplier deleted successfully.']);
    }
}
