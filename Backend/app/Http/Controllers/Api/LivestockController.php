<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Livestock;
use App\Models\Mob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LivestockController extends Controller
{
    public function store(Request $request, Mob $mob): JsonResponse
    {
        // Feature 1: Block adding animals to a CLOSED MOB
        if ($mob->mob_status === 'CLOSED') {
            return response()->json([
                'message' => 'This MOB is closed and cannot accept new animals.',
            ], 422);
        }

        $data = $request->validate([
            'species'         => 'required|in:cattle,sheep,goat,camel',
            'gender'          => 'required|in:male,female',
            'weight'          => 'required|numeric|min:0.001|max:9999.999',
            'unit_code'       => 'nullable|string|max:20',
            'unit'            => 'nullable|string|max:5',
            'scale_device_id' => 'nullable|string|max:100',
            'manual_entry'    => 'nullable|boolean',
            'manual_reason'   => 'nullable|string|max:255',
        ]);

        $itemNo = $mob->livestock()->count() + 1;
        $livNo  = 'LIV' . str_pad($itemNo, 3, '0', STR_PAD_LEFT);

        $animal = Livestock::create([
            'mob_id'           => $mob->id,
            'livestock_number' => $livNo,
            'species'          => strtolower($data['species']),
            'gender'           => strtolower($data['gender']),
            'unit_code'        => $data['unit_code'] ?? $livNo,
            'unit'             => $data['unit'] ?? 'KG',
            'weight'           => (float) $data['weight'],
            'weight_locked'    => true,
            'unit_price'       => 0,
            'value'            => 0,
            'item_no'          => $itemNo,
            'item_description' => $this->buildDescription($data['species'], $data['gender']),
            'scale_device_id'  => $data['scale_device_id'] ?? null,
            'manual_entry'     => (bool) ($data['manual_entry'] ?? false),
            'manual_reason'    => $data['manual_reason'] ?? null,
        ]);

        // Recalculate total weight on the mob
        $mob->update(['total_weight' => $mob->livestock()->sum('weight')]);

        return response()->json($animal, 201);
    }

    public function update(Request $request, Mob $mob, Livestock $animal): JsonResponse
    {
        // Feature 1: Block editing livestock in a CLOSED MOB
        if ($mob->mob_status === 'CLOSED') {
            return response()->json([
                'message' => 'This MOB is closed. Animal records cannot be edited.',
            ], 422);
        }

        $data = $request->validate([
            'weight'       => 'sometimes|numeric|min:0.001|max:9999.999',
            'manual_entry' => 'sometimes|boolean',
            'manual_reason'=> 'sometimes|nullable|string|max:255',
        ]);

        $animal->update($data);
        $mob->update(['total_weight' => $mob->livestock()->sum('weight')]);

        return response()->json($animal->fresh());
    }

    public function destroy(Request $request, Mob $mob, Livestock $animal): JsonResponse
    {
        // Feature 1: Block deleting livestock from a CLOSED MOB
        if ($mob->mob_status === 'CLOSED') {
            return response()->json([
                'message' => 'This MOB is closed. Animal records cannot be deleted.',
            ], 422);
        }

        $animal->delete();
        $mob->update(['total_weight' => $mob->livestock()->sum('weight')]);

        return response()->json(['message' => 'Animal removed.']);
    }

    private function buildDescription(string $species, string $gender): string
    {
        if (strtolower($species) === 'cattle') {
            return strtolower($gender) === 'male' ? 'CATTLE BULL' : 'CATTLE COW';
        }
        return strtoupper($species) . ' ' . strtoupper($gender);
    }
}
