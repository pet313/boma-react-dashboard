<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateAndSendGrn;
use App\Mail\GrnDeliveryMail;
use App\Models\Livestock;
use App\Models\Mob;
use App\Models\Supplier;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\QRCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

class MobController extends Controller
{
    // ── List ─────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->query('per_page', 50), 200);

        $mobs = Mob::with(['supplier', 'livestock'])
            ->when($request->filled('mob_status'),  fn($q) => $q->where('mob_status', strtoupper($request->mob_status)))
            ->when($request->filled('supplier_id'), fn($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->filled('date_from'),   fn($q) => $q->whereDate('received_date', '>=', $request->date_from))
            ->when($request->filled('date_to'),     fn($q) => $q->whereDate('received_date', '<=', $request->date_to))
            ->orderByDesc('id')
            ->cursorPaginate($perPage);

        return response()->json($mobs);
    }

    // ── Create ───────────────────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'supplier_id'     => 'required|exists:suppliers,id',
            'location'        => 'required|string|max:255',
            'received_date'   => 'required|date',
            'cost_center'     => 'nullable|string|max:100',
            'ar_number'       => 'nullable|string|max:100',
            'supplier_inv_no' => 'nullable|string|max:100',
            'adv_no'          => 'nullable|string|max:100',
            'order_no'        => 'nullable|string|max:100',
            'storage'         => 'nullable|string|max:255',
        ]);

        $data['received_by'] = $request->user()->id;
        $data['mob_status']  = 'OPEN';
        // Created via server API (dashboard/web) — mark as not 'synced' to
        // avoid treating server-created MOBs as read-only in clients that
        // interpret `synced` as immutable. The UI should only prevent
        // changes when `mob_status` is CLOSED.
        $data['synced'] = false;

        $mob = Mob::create($data);
        $mob->refresh();

        return response()->json($mob->load(['supplier', 'livestock']), 201);
    }

    // ── Show ─────────────────────────────────────────────────────────────────
    public function show(Mob $mob): JsonResponse
    {
        return response()->json($mob->load(['supplier', 'livestock', 'officer', 'closedByUser']));
    }

    // ── Update ───────────────────────────────────────────────────────────────
    public function update(Request $request, Mob $mob): JsonResponse
    {
        if ($mob->mob_status === 'CLOSED' && $request->user()->role !== 'admin') {
            return response()->json(['message' => 'This MOB is closed and cannot be modified.'], 422);
        }

        $data = $request->validate([
            'cost_center'     => 'sometimes|nullable|string|max:100',
            'ar_number'       => 'sometimes|nullable|string|max:100',
            'supplier_inv_no' => 'sometimes|nullable|string|max:100',
            'adv_no'          => 'sometimes|nullable|string|max:100',
            'order_no'        => 'sometimes|nullable|string|max:100',
            'storage'         => 'sometimes|nullable|string|max:255',
            'location'        => 'sometimes|string|max:255',
        ]);

        $mob->update($data);
        return response()->json($mob->fresh()->load(['supplier', 'livestock', 'officer']));
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    public function destroy(Request $request, $id): JsonResponse
    {
        $mob = Mob::find($id);
        if (! $mob) {
            return response()->json(['message' => 'MOB not found.'], 404);
        }

        if ($mob->mob_status === 'CLOSED') {
            return response()->json(['message' => 'Cannot delete a CLOSED MOB.'], 422);
        }

        DB::transaction(function () use ($mob) {
            $mob->livestock()->delete();
            $mob->delete();
        });

        return response()->json(['message' => 'MOB and all associated livestock deleted.']);
    }

    // ── Sync ─────────────────────────────────────────────────────────────────
    public function sync(Request $request): JsonResponse
    {
        $request->validate([
            'mobs'               => 'required|array|min:1|max:100',
            'mobs.*.local_id'    => 'required|integer',
            'mobs.*.server_id'   => 'nullable|integer',
            'mobs.*.supplier_id' => 'required|exists:suppliers,id',
            'mobs.*.location'    => 'required|string|max:255',
            'mobs.*.received_date' => 'required|date',
            'mobs.*.livestock'   => 'nullable|array',
        ]);

        $synced = [];
        $errors = [];

        foreach ($request->mobs as $mobData) {
            $localId  = $mobData['local_id']  ?? null;
            $serverId = $mobData['server_id'] ?? 0;

            try {
                DB::beginTransaction();

                $mobFields = [
                    'supplier_id'     => $mobData['supplier_id'],
                    'location'        => $mobData['location'],
                    'received_date'   => $mobData['received_date'],
                    'cost_center'     => $mobData['cost_center']      ?? null,
                    'ar_number'       => $mobData['ar_number']        ?? null,
                    'supplier_inv_no' => $mobData['supplier_inv_no']  ?? null,
                    'adv_no'          => $mobData['adv_no']           ?? null,
                    'order_no'        => $mobData['order_no']         ?? null,
                    'storage'         => $mobData['storage']          ?? null,
                ];

                if ($serverId > 0) {
                    $mob = Mob::find($serverId);
                    if (!$mob) {
                        throw new \Exception("Mob #$serverId not found on server.");
                    }
                    if ($mob->mob_status === 'CLOSED') {
                        throw new \Exception("Cannot update animals in a CLOSED Mob.");
                    }
                    $mob->update($mobFields);
                    // Only wipe existing livestock if the client sent livestock data.
                    // This prevents accidental deletion when a client syncs metadata
                    // without including the animals payload.
                    if (! empty($mobData['livestock'])) {
                        $mob->livestock()->delete();
                    }
                } else {
                    $mobFields['received_by'] = $request->user()->id;
                    $mobFields['mob_status']  = 'OPEN';
                    $mob = Mob::create($mobFields);
                    $mob->refresh();
                }

                $itemNo = 1;
                foreach ($mobData['livestock'] ?? [] as $a) {
                    $species = strtolower($a['species'] ?? 'cattle');
                    $gender  = strtolower($a['gender']  ?? 'male');
                    $livNo   = $a['livestock_number'] ?? ('LIV' . str_pad((string)$itemNo, 3, '0', STR_PAD_LEFT));
                    $desc    = ($species === 'cattle')
                        ? ($gender === 'male' ? 'CATTLE BULL' : 'CATTLE COW')
                        : strtoupper($species) . ' ' . strtoupper($gender);

                    Livestock::create([
                        'mob_id'           => $mob->id,
                        'livestock_number' => $livNo,
                        'species'          => $species,
                        'gender'           => $gender,
                        'unit_code'        => $a['unit_code'] ?? $livNo,
                        'unit'             => $a['unit']      ?? 'KG',
                        'weight'           => (float) ($a['weight'] ?? 0),
                        'weight_locked'    => true,
                        'unit_price'       => 0,
                        'value'            => 0,
                        'item_no'          => $itemNo,
                        'item_description' => $desc,
                        'scale_device_id'  => $a['scale_device_id'] ?? null,
                        'manual_entry'     => (bool) ($a['manual_entry'] ?? false),
                        'manual_reason'    => $a['manual_reason']    ?? null,
                    ]);
                    $itemNo++;
                }

                $totalWeight = $mob->livestock()->sum('weight');
                $mob->update(['total_weight' => $totalWeight]);

                DB::commit();

                $synced[] = [
                    'local_id'   => (int) $localId,
                    'server_id'  => $mob->id,
                    'grn_number' => (string) $mob->grn_number,
                    'mob_number' => (string) $mob->mob_number,
                    'mob_status' => $mob->mob_status,
                ];

            } catch (\Throwable $e) {
                DB::rollBack();
                Log::error("Sync error local_id=$localId", ['message' => $e->getMessage()]);
                $errors[] = ['local_id' => $localId, 'message' => $e->getMessage()];
            }
        }

        $status = empty($errors) ? 200 : (empty($synced) ? 422 : 207);
        return response()->json(['synced' => $synced, 'errors' => $errors], $status);
    }

    // ── Close MOB ────────────────────────────────────────────────────────────
    public function close(Request $request, Mob $mob): JsonResponse
    {
        $user = $request->user();

        if (! in_array($user->role, ['officer', 'admin'])) {
            return response()->json(['message' => 'Only Measuring Officers can close a MOB.'], 403);
        }

        if ($mob->mob_status === 'CLOSED') {
            return response()->json([
                'message'       => 'This MOB is already closed.',
                'mob_status'    => 'CLOSED',
                'grn_number'    => $mob->grn_number,
                'grn_generated' => $mob->grn_generated,
                'email_status'  => $mob->email_status,
            ], 422);
        }

        $animalCount = $mob->livestock()->count();
        if ($animalCount === 0) {
            return response()->json([
                'message' => 'Cannot close an empty MOB. Add at least one animal first.',
            ], 422);
        }

        // ── Step 1: Close the MOB ─────────────────────────────────────────────
        try {
            DB::beginTransaction();
            $totalWeight = DB::table('livestock')->where('mob_id', $mob->id)->sum('weight');
            DB::table('mobs')->where('id', $mob->id)->update([
                'mob_status'   => 'CLOSED',
                'closed_at'    => now(),
                'closed_by'    => $user->id,
                'total_weight' => $totalWeight,
                'updated_at'   => now(),
            ]);
            DB::commit();
            $mob->refresh();
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('MOB close failed id=' . $mob->id, ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to close MOB: ' . $e->getMessage()], 500);
        }

        $mob->load(['supplier', 'officer', 'livestock']);

        // ── Step 2: Queue PDF Generation & Email ─────────────────────────────
        GenerateAndSendGrn::dispatch($mob);

        return response()->json([
            'message'       => 'MOB closed successfully. GRN generation and email have been queued.',
            'mob_status'    => 'CLOSED',
            'closed_at'     => $mob->closed_at,
            'closed_by'     => $user->name,
            'grn_number'    => $mob->grn_number,
            'total_animals' => $animalCount,
            'total_weight'  => (float) $mob->total_weight,
        ]);
    }

    // ── Retry Email ──────────────────────────────────────────────────────────
    public function retryEmail(Request $request, Mob $mob): JsonResponse
    {
        if ($mob->mob_status !== 'CLOSED') {
            return response()->json(['message' => 'MOB must be CLOSED to retry email.'], 422);
        }

        // Allow forcing resend even if already SENT when client supplies ?force=1
        $force = (bool) $request->input('force', false);
        if ($mob->email_status === 'SENT' && ! $force) {
            return response()->json(['message' => 'Email already sent successfully.'], 422);
        }

        GenerateAndSendGrn::dispatch($mob);

        return response()->json([
            'message'      => 'GRN delivery job has been queued.',
            'email_status' => 'PENDING'
        ]);
    }
}
