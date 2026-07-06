<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Mob;
use Barryvdh\DomPDF\Facade\Pdf;
use chillerlan\QRCode\QRCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class GrnController extends Controller
{
    /**
     * GET /mobs/{mob}/grn?copy=farmer|commission
     * Stream the GRN PDF — only allowed for CLOSED MOBs.
     */
    public function generate(Request $request, Mob $mob): Response
    {
        // Feature 2: GRN only for CLOSED mobs
        if ($mob->mob_status !== 'CLOSED') {
            abort(422, 'GRN can only be generated after MOB is closed.');
        }

        $copy = in_array($request->query('copy'), ['farmer', 'commission'])
            ? $request->query('copy')
            : 'farmer';

        $mob->load(['supplier', 'officer', 'livestock']);

        if (empty($mob->grn_number)) {
            abort(422, 'This MOB does not yet have a GRN number.');
        }

        $qrData = "GRN: {$mob->grn_number} | MOB: {$mob->mob_number} | Supplier: {$mob->supplier->name} | Weight: " . number_format($mob->total_weight, 3) . " KG | Date: " . $mob->received_date->format('d/m/Y');
        $qrCode = (new QRCode)->render($qrData);

        $pdf = Pdf::loadView('grn.goods_received_note', [
            'mob'    => $mob,
            'copy'   => $copy,
            'qrCode' => $qrCode,
        ])->setPaper('a4', 'portrait');

        $filename = "GRN_{$mob->grn_number}_{$copy}.pdf";
        $filename = preg_replace('/[^A-Za-z0-9_\-.]/', '_', $filename);

        return $pdf->download($filename);
    }

    /**
     * GET /mobs/{mob}/grn-data
     * Return GRN data as JSON — only for CLOSED MOBs.
     */
    public function data(Mob $mob): JsonResponse
    {
        // Feature 2: GRN data only for CLOSED mobs
        if ($mob->mob_status !== 'CLOSED') {
            return response()->json([
                'message' => 'GRN can only be generated after MOB is closed.',
            ], 422);
        }

        $mob->load(['supplier', 'officer', 'livestock' => fn($q) => $q->orderBy('item_no')]);

        if (! $mob->supplier || ! $mob->officer) {
            return response()->json(['message' => 'MOB data is incomplete (missing supplier or officer).'], 422);
        }

        return response()->json([
            'grn_number'      => $mob->grn_number,
            'mob_number'      => $mob->mob_number,
            'mob_status'      => $mob->mob_status,
            'grn_generated'   => (bool) $mob->grn_generated,
            'email_status'    => $mob->email_status,
            'email_sent_at'   => $mob->email_sent_at,
            'location'        => $mob->location,
            'received_date'   => $mob->received_date?->format('d/m/Y'),
            'closed_at'       => $mob->closed_at?->format('d/m/Y H:i'),
            'supplier' => [
                'name'       => $mob->supplier->name,
                'farmer_no'  => $mob->supplier->farmer_no,
                'id_number'  => $mob->supplier->id_number,
                'phone'      => $mob->supplier->phone,
                'email'      => $mob->supplier->email,
                'location'   => $mob->supplier->location,
                'bank_name'  => $mob->supplier->bank_name,
                'kra_pin'    => $mob->supplier->kra_pin,
            ],
            'officer' => [
                'name'        => $mob->officer->name,
                'employee_id' => $mob->officer->employee_id,
            ],
            'storage'         => $mob->storage,
            'cost_center'     => $mob->cost_center,
            'ar_number'       => $mob->ar_number,
            'supplier_inv_no' => $mob->supplier_inv_no,
            'adv_no'          => $mob->adv_no,
            'order_no'        => $mob->order_no,
            'total_weight'    => (float) $mob->total_weight,
            'livestock'       => $mob->livestock->map(fn($a) => [
                'item_no'          => $a->item_no,
                'livestock_number' => $a->livestock_number,
                'unit_code'        => $a->unit_code,
                'unit'             => $a->unit,
                'item_description' => $a->item_description,
                'species'          => $a->species,
                'gender'           => $a->gender,
                'qty'              => (float) $a->weight,
            ]),
        ]);
    }
}
